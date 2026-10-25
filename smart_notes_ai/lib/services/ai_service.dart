import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AISummaryResult {
  final String summary;
  final List<String> keyActionItems;
  final String? suggestedTitle;
  final bool isFromCloudAi;

  const AISummaryResult({
    required this.summary,
    required this.keyActionItems,
    this.suggestedTitle,
    required this.isFromCloudAi,
  });
}

class AIService {
  static final AIService instance = AIService._internal();
  AIService._internal();

  /// Primary summarization method.
  /// If a valid user-provided Gemini/Proxy API key is present, calls the LLM.
  /// Otherwise, falls back to the deterministic local offline extractive summarizer.
  Future<AISummaryResult> summarizeNote({
    required String content,
    String? title,
    String? apiKey,
  }) async {
    if (content.trim().isEmpty) {
      return const AISummaryResult(
        summary: 'No content to summarize.',
        keyActionItems: [],
        suggestedTitle: null,
        isFromCloudAi: false,
      );
    }

    // If user provided a cloud key, attempt Cloud AI call
    if (apiKey != null && apiKey.trim().isNotEmpty) {
      try {
        final cloudResult = await _callGeminiApi(
          content: content,
          title: title,
          apiKey: apiKey.trim(),
        );
        if (cloudResult != null) {
          return cloudResult;
        }
      } catch (e) {
        debugPrint('Cloud AI API call failed, falling back to offline: $e');
      }
    }

    // Default: High-quality local offline extractive summarizer
    return _generateOfflineSummary(content: content, title: title);
  }

  /// High-efficiency local rule-based extractor that runs 100% offline.
  /// Zero server calls, zero data leaks, zero costs.
  AISummaryResult _generateOfflineSummary({
    required String content,
    String? title,
  }) {
    final sentences = content
        .split(RegExp(r'(?<=[.!?\n])\s+'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty && s.length > 5)
        .toList();

    // Extract action items
    final actionKeywords = [
      'todo',
      'to-do',
      'need to',
      'must',
      'should',
      'don\'t forget',
      'remember to',
      'call',
      'buy',
      'finish',
      'complete',
      'review',
      'send',
      'schedule'
    ];

    final actionItems = <String>[];
    for (final s in sentences) {
      final lower = s.toLowerCase();
      if (actionKeywords.any((kw) => lower.contains(kw))) {
        actionItems.add(s.replaceAll(RegExp(r'^[-*•\s]+'), ''));
      }
    }

    // Extract top sentences for concise summary
    String summary;
    if (sentences.isEmpty) {
      summary = content.length > 120 ? '${content.substring(0, 120)}...' : content;
    } else if (sentences.length <= 2) {
      summary = sentences.join(' ');
    } else {
      // Pick first sentence, and highest content sentence
      summary = '${sentences.first} ${sentences[1]}';
    }

    // Suggest title if none given
    String? suggestedTitle;
    if (title == null || title.trim().isEmpty) {
      final firstLine = content.split('\n').first.trim();
      if (firstLine.isNotEmpty) {
        suggestedTitle = firstLine.length > 35
            ? '${firstLine.substring(0, 32)}...'
            : firstLine;
      }
    }

    return AISummaryResult(
      summary: summary,
      keyActionItems: actionItems.take(5).toList(),
      suggestedTitle: suggestedTitle,
      isFromCloudAi: false,
    );
  }

  /// Optional Gemini API caller. Only executed if the user explicitly configures an API key.
  Future<AISummaryResult?> _callGeminiApi({
    required String content,
    String? title,
    required String apiKey,
  }) async {
    final url = Uri.parse(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey',
    );

    final prompt = '''
Analyze this note and respond in valid JSON format:
Title: "${title ?? ''}"
Content: "${content.replaceAll('"', '\\"')}"

Respond ONLY with this exact JSON format:
{
  "summary": "1-3 concise sentences summarizing key points",
  "actionItems": ["action item 1", "action item 2"],
  "suggestedTitle": "Short 3-5 word descriptive title"
}
''';

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'contents': [
          {
            'parts': [
              {'text': prompt}
            ]
          }
        ],
        'generationConfig': {
          'responseMimeType': 'application/json',
          'temperature': 0.2,
        }
      }),
    );

    if (response.statusCode == 200) {
      final jsonResp = json.decode(response.body);
      final rawText = jsonResp['candidates']?[0]?['content']?['parts']?[0]?['text'];
      if (rawText != null) {
        final parsed = json.decode(rawText.toString()) as Map<String, dynamic>;
        final summary = parsed['summary'] as String? ?? '';
        final actionItems = (parsed['actionItems'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [];
        final suggestedTitle = parsed['suggestedTitle'] as String?;

        return AISummaryResult(
          summary: summary,
          keyActionItems: actionItems,
          suggestedTitle: suggestedTitle,
          isFromCloudAi: true,
        );
      }
    }
    return null;
  }
}
