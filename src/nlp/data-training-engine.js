/**
 * Data Training Engine
 * Parses, tokenizes, and indexes custom user-uploaded data
 * Supports CSV, JSON, Markdown/FAQ Text, and Document Paragraphs.
 */

export class DataTrainingEngine {
  constructor(initialItems = []) {
    this.items = [];
    if (Array.isArray(initialItems) && initialItems.length > 0) {
      this.ingestArray(initialItems);
    }
  }

  getItems() {
    return this.items;
  }

  getItemCount() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }

  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
  }

  /**
   * Parse CSV text into Q&A objects
   * Handles comma/tab separated, quotes, multi-line values
   */
  parseCSV(csvText) {
    if (!csvText || !csvText.trim()) return [];

    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const parseRow = (row) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === '\t') && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return result;
    };

    const firstRow = parseRow(lines[0]);
    const lowerFirst = firstRow.map(h => h.toLowerCase());

    let hasHeader = false;
    let qIdx = 0;
    let aIdx = 1;
    let catIdx = -1;
    let kwIdx = -1;

    // Detect header row
    const headerKeywords = ['question', 'query', 'prompt', 'q', 'title', 'topic'];
    const answerKeywords = ['answer', 'response', 'reply', 'a', 'content', 'solution'];
    if (lowerFirst.some(h => headerKeywords.includes(h))) {
      hasHeader = true;
      qIdx = lowerFirst.findIndex(h => headerKeywords.includes(h));
      const foundA = lowerFirst.findIndex(h => answerKeywords.includes(h));
      if (foundA !== -1) aIdx = foundA;
      catIdx = lowerFirst.findIndex(h => ['category', 'topic', 'tag', 'department', 'section'].includes(h));
      kwIdx = lowerFirst.findIndex(h => ['keywords', 'tags', 'synonyms', 'labels'].includes(h));
    }

    const startLine = hasHeader ? 1 : 0;
    const items = [];

    for (let i = startLine; i < lines.length; i++) {
      const cols = parseRow(lines[i]);
      const question = cols[qIdx] || '';
      const answer = cols[aIdx] || '';
      if (!question || !answer) continue;

      const category = catIdx >= 0 && cols[catIdx] ? cols[catIdx] : 'general';
      const keywords = kwIdx >= 0 && cols[kwIdx]
        ? cols[kwIdx].split(/[,;|]/).map(k => k.trim()).filter(Boolean)
        : this.extractKeywords(question);

      items.push({
        id: `custom_kb_${Date.now()}_${items.length}`,
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        keywords,
        tags: [category, ...keywords.slice(0, 3)],
        isCustomTrained: true
      });
    }

    return items;
  }

  /**
   * Parse JSON input (Array of objects or key-value dictionary)
   */
  parseJSON(jsonTextOrObj) {
    let data = jsonTextOrObj;
    if (typeof jsonTextOrObj === 'string') {
      try {
        data = JSON.parse(jsonTextOrObj);
      } catch (err) {
        throw new Error('Invalid JSON format: ' + err.message);
      }
    }

    const items = [];
    if (Array.isArray(data)) {
      data.forEach((item, idx) => {
        const q = item.question || item.query || item.q || item.title || item.prompt;
        const a = item.answer || item.response || item.reply || item.a || item.content || item.text;
        if (q && a) {
          items.push({
            id: item.id || `custom_kb_${Date.now()}_${idx}`,
            question: String(q).trim(),
            answer: String(a).trim(),
            category: item.category || 'general',
            keywords: Array.isArray(item.keywords) ? item.keywords : this.extractKeywords(String(q)),
            tags: Array.isArray(item.tags) ? item.tags : [item.category || 'custom'],
            isCustomTrained: true
          });
        }
      });
    } else if (data && typeof data === 'object') {
      const nested = data.faqs || data.items || data.data || data.questions || data.knowledge;
      if (Array.isArray(nested)) {
        return this.parseJSON(nested);
      }
      let idx = 0;
      for (const [q, a] of Object.entries(data)) {
        if (typeof a === 'string' || (a && typeof a === 'object' && a.answer)) {
          const ansText = typeof a === 'string' ? a : a.answer;
          items.push({
            id: `custom_kb_${Date.now()}_${idx++}`,
            question: q.trim(),
            answer: String(ansText).trim(),
            category: (typeof a === 'object' && a.category) ? a.category : 'general',
            keywords: this.extractKeywords(q),
            tags: ['custom'],
            isCustomTrained: true
          });
        }
      }
    }

    return items;
  }

  /**
   * Parse Plain Text / Markdown FAQ Format
   * Recognizes:
   * Q: <Question>
   * A: <Answer>
   * Or:
   * ### <Heading / Question>
   * <Answer text>
   */
  parsePlainText(rawText) {
    if (!rawText || !rawText.trim()) return [];
    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const items = [];

    // Pattern 1: State Machine line-by-line Q: / A: parser
    const lines = text.split('\n');
    let currentQ = null;
    let currentA = [];
    let currentCat = 'general';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const qMatch = trimmed.match(/^(?:Q|Question)\s*:\s*(.+)$/i);
      const aMatch = trimmed.match(/^(?:A|Answer)\s*:\s*(.*)$/i);

      if (qMatch) {
        if (currentQ && currentA.length > 0) {
          const ans = currentA.join('\n').trim();
          if (ans) {
            items.push({
              id: `custom_kb_${Date.now()}_${items.length}`,
              question: currentQ.trim(),
              answer: ans,
              category: currentCat,
              keywords: this.extractKeywords(currentQ),
              tags: ['faq', 'custom'],
              isCustomTrained: true
            });
          }
        }
        currentQ = qMatch[1].trim();
        currentA = [];
      } else if (aMatch && currentQ) {
        if (aMatch[1]) currentA.push(aMatch[1]);
      } else if (currentQ && currentA.length > 0) {
        currentA.push(line);
      }
    }

    if (currentQ && currentA.length > 0) {
      const lastAns = currentA.join('\n').trim();
      if (lastAns) {
        items.push({
          id: `custom_kb_${Date.now()}_${items.length}`,
          question: currentQ.trim(),
          answer: lastAns,
          category: currentCat,
          keywords: this.extractKeywords(currentQ),
          tags: ['faq', 'custom'],
          isCustomTrained: true
        });
      }
    }

    if (items.length > 0) return items;

    // Pattern 2: Markdown headers: # Question \n Answer
    const mdRegex = /(?:^|\n)#{1,4}\s*([^\n]+)\s*\n([\s\S]+?)(?=(?:\n#{1,4}\s*)|$)/g;
    while ((match = mdRegex.exec(rawText)) !== null) {
      matchedAny = true;
      const q = match[1].trim();
      const a = match[2].trim();
      if (q && a) {
        items.push({
          id: `custom_kb_${Date.now()}_${items.length}`,
          question: q,
          answer: a,
          category: 'general',
          keywords: this.extractKeywords(q),
          tags: ['markdown', 'custom'],
          isCustomTrained: true
        });
      }
    }

    if (matchedAny && items.length > 0) return items;

    // Pattern 3: Paragraph splitting (double newlines)
    const paras = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 15);
    paras.forEach((p, idx) => {
      const lines = p.trim().split('\n');
      const firstLine = lines[0].replace(/^[0-9]+[\.\)]\s*/, '').trim();
      const rest = lines.slice(1).join('\n').trim() || firstLine;
      items.push({
        id: `custom_kb_${Date.now()}_${idx}`,
        question: firstLine.length < 120 ? firstLine : firstLine.slice(0, 117) + '...',
        answer: p.trim(),
        category: 'document',
        keywords: this.extractKeywords(firstLine),
        tags: ['document', 'custom'],
        isCustomTrained: true
      });
    });

    return items;
  }

  /**
   * Universal ingestion method
   */
  trainFromText(rawContent, format = 'auto') {
    let parsed = [];
    const trimmed = (rawContent || '').trim();

    if (format === 'json' || (format === 'auto' && (trimmed.startsWith('{') || trimmed.startsWith('[')))) {
      try {
        parsed = this.parseJSON(trimmed);
      } catch (err) {
        if (format === 'json') throw err;
      }
    }

    if (parsed.length === 0 && (format === 'csv' || (format === 'auto' && (trimmed.includes(',') || trimmed.includes('\t')) && trimmed.includes('\n')))) {
      parsed = this.parseCSV(trimmed);
    }

    if (parsed.length === 0) {
      parsed = this.parsePlainText(trimmed);
    }

    this.ingestArray(parsed);
    return {
      success: true,
      countAdded: parsed.length,
      totalCount: this.items.length,
      items: parsed
    };
  }

  ingestArray(newItems) {
    if (!Array.isArray(newItems)) return;
    newItems.forEach(item => {
      if (!item || !item.question || !item.answer) return;
      const cleanItem = {
        ...item,
        isCustomTrained: true,
        keywords: item.keywords && item.keywords.length ? item.keywords : this.extractKeywords(item.question)
      };
      const existingIdx = this.items.findIndex(existing =>
        existing.question.toLowerCase().trim() === item.question.toLowerCase().trim()
      );
      if (existingIdx >= 0) {
        this.items[existingIdx] = { ...this.items[existingIdx], ...cleanItem };
      } else {
        this.items.push(cleanItem);
      }
    });
  }

  extractKeywords(text) {
    if (!text) return [];
    const stopWords = new Set(['what', 'is', 'the', 'how', 'do', 'can', 'are', 'in', 'to', 'for', 'of', 'and', 'a', 'an', 'my', 'your', 'we', 'you', 'it', 'on', 'with', 'at', 'by', 'this', 'that', 'from', 'our', 'will', 'does']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  exportJSON() {
    return JSON.stringify(this.items, null, 2);
  }

  exportCSV() {
    let csv = 'Question,Answer,Category,Keywords\n';
    this.items.forEach(item => {
      const q = `"${item.question.replace(/"/g, '""')}"`;
      const a = `"${item.answer.replace(/"/g, '""')}"`;
      const cat = `"${(item.category || 'general').replace(/"/g, '""')}"`;
      const kw = `"${(item.keywords || []).join('; ').replace(/"/g, '""')}"`;
      csv += `${q},${a},${cat},${kw}\n`;
    });
    return csv;
  }
}

export default DataTrainingEngine;
