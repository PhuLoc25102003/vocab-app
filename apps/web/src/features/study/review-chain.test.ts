import { beforeEach, describe, expect, it } from 'vitest';
import {
  chainHref,
  clearReviewCards,
  clearReviewChain,
  loadReviewCards,
  loadReviewChain,
  loadReviewModes,
  parseModeList,
  reviewHref,
  saveReviewCards,
  saveReviewChain,
  saveReviewModes,
} from './review-chain';

describe('review-chain', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('đọc danh sách chế độ, bỏ giá trị lạ và trùng', () => {
    expect(parseModeList('mcq,abc,MCQ,write,test')).toEqual(['MCQ', 'WRITE']);
    expect(parseModeList(undefined)).toEqual([]);
  });

  it('phiên đầu ôn thẻ đến hạn, phiên sau ôn lại đúng các thẻ đó', () => {
    expect(reviewHref('s1', ['FLASHCARD', 'MCQ', 'WRITE'])).toBe(
      '/sets/s1/study/flashcard?due=1&next=mcq%2Cwrite',
    );
    expect(chainHref('s1', ['MCQ'])).toBe('/sets/s1/study/mcq?review=1');
  });

  it('nhớ lựa chọn chế độ, mặc định Flashcard', () => {
    expect(loadReviewModes()).toEqual(['FLASHCARD']);
    saveReviewModes(['MCQ', 'MATCH']);
    expect(loadReviewModes()).toEqual(['MCQ', 'MATCH']);
  });

  it('giữ thẻ của lượt ôn trong tab, xoá khi bắt đầu lượt mới', () => {
    saveReviewCards('s1', ['c1', 'c2', 'c1']);
    expect(loadReviewCards('s1')).toEqual(['c1', 'c2']);
    clearReviewCards('s1');
    expect(loadReviewCards('s1')).toBeNull();
  });

  it('giữ chuỗi chế độ ôn trong tab, xoá khi kết thúc chuỗi', () => {
    saveReviewChain('s1', ['FLASHCARD', 'LEARN', 'WRITE']);
    expect(loadReviewChain('s1')).toEqual(['FLASHCARD', 'LEARN', 'WRITE']);
    clearReviewChain('s1');
    expect(loadReviewChain('s1')).toBeNull();
  });

  it('bỏ chế độ lạ khi đọc chuỗi đã lưu', () => {
    window.sessionStorage.setItem('vocab.review-chain:s1', '["FLASHCARD","HACK",3]');
    expect(loadReviewChain('s1')).toEqual(['FLASHCARD']);
    window.sessionStorage.setItem('vocab.review-chain:s1', '{"a":1}');
    expect(loadReviewChain('s1')).toBeNull();
  });
});
