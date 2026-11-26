import { describe, expect, it } from 'vitest';
import { DEMO_COMPLAINTS } from '../../data/demoComplaints';
import {
  analyzeComplaintDeterministic,
  findPotentialDuplicate,
  validateExtractionResult,
} from '../aiService';

describe('SpeakUp AI Extraction & Safeguards', () => {
  it('extracts structured fields for the Kukatpally pothole example without inventing data', () => {
    const input =
      'There is a big pothole on the main road near the bus stop in Kukatpally. It has been there for two weeks.';
    const res = analyzeComplaintDeterministic(input, 'en');

    expect(res.category).toBe('Road damage');
    expect(res.department).toContain('Roads & Engineering');
    expect(res.location.toLowerCase()).toContain('kukatpally');
    expect(res.title).toBe('Pothole on main road');
    expect(res.urgency).toBe('high');
    expect(res.missingFields).not.toContain('category');
  });

  it('never fabricates missing location and asks for clarification when location is absent', () => {
    const res = analyzeComplaintDeterministic(
      'The streetlight is flickering badly and completely dark.',
      'en'
    );

    expect(res.category).toBe('Streetlight');
    expect(res.location).toBe('');
    expect(res.missingFields).toContain('location');
    expect(res.clarificationQuestions.some((q) => q.field === 'location')).toBe(true);
  });

  it('flags uncertain category when input is ambiguous instead of misrouting', () => {
    const res = analyzeComplaintDeterministic('Please help fix this problem soon.', 'en');

    expect(res.category).toBe('Uncertain');
    expect(res.missingFields).toContain('category');
    expect(res.clarificationQuestions.some((q) => q.field === 'category')).toBe(true);
  });

  it('supports Hindi and Telugu inputs deterministically', () => {
    const hi = analyzeComplaintDeterministic(
      'कुकटपल्ली बस स्टॉप के पास सड़क पर बड़ा गड्ढा है',
      'hi'
    );
    expect(hi.category).toBe('Road damage');

    const te = analyzeComplaintDeterministic(
      'కూకట్‌పల్లి బస్ స్టాప్ దగ్గర వీధి దీపం వెలగడం లేదు',
      'te'
    );
    expect(te.category).toBe('Streetlight');
  });

  it('validates and sanitizes malformed JSON from an LLM endpoint', () => {
    const validated = validateExtractionResult({
      title: 'Broken pipe',
      category: 'InvalidCategoryXYZ',
      location: '',
      urgency: 'extreme',
      categoryConfidence: 0.4,
      locationConfidence: 0.1,
      source: 'llm',
    });

    expect(validated).not.toBeNull();
    expect(validated?.category).toBe('Uncertain');
    expect(validated?.urgency).toBe('medium');
    expect(validated?.missingFields).toContain('category');
    expect(validated?.missingFields).toContain('location');
  });

  it('detects potential duplicate complaints in the same category and area within 48h', () => {
    const recentComplaint = {
      ...DEMO_COMPLAINTS[1], // Garbage not collected, Madhapur, 14h ago, status submitted
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    };
    const dup = findPotentialDuplicate(
      [recentComplaint],
      'Garbage & sanitation',
      'Ayyappa Society, Madhapur'
    );
    expect(dup).not.toBeNull();
    expect(dup?.reference_number).toBe(recentComplaint.reference_number);
  });
});
