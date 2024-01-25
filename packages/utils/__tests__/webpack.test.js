'use strict'

const globToRegExp = require('glob-to-regexp').default;
const {
  stringToRegexp,
  ignoredToFunction,
  universalify,
  combinedFn,
  WebpackWrapper,
} = require('..');

describe('@morjs/utils - webpack.test.js', () => {
  describe('stringToRegexp', () => {
    it('should convert glob patterns to regular expressions correctly', () => {
      // 普通匹配测试
      expect(stringToRegexp('*.js')).toEqual('^([^/]*)\\.js(?:$|\\/)');
      expect(stringToRegexp('**/*.test.js')).toEqual('^((?:[^/]*(?:\\/|$))*)([^/]*)\\.test\\.js(?:$|\\/)');
      
      // 负向匹配测试
      expect(stringToRegexp('!*.js')).toEqual('^\\!([^/]*)\\.js(?:$|\\/)');
      expect(stringToRegexp('!**/*.test.js')).toEqual('^\\!([^/]*)\\/([^/]*)\\.test\\.js(?:$|\\/)');
      
      // 特殊字符和路径测试
      expect(stringToRegexp('src/**/*.+(js|ts)')).toEqual('^src\\/((?:[^/]*(?:\\/|$))*)([^/]*)\\.\\+\\(js\\|ts\\)(?:$|\\/)');
      expect(stringToRegexp('!src/api/*.+(js|ts)')).toEqual('^\\!src\\/api\\/([^/]*)\\.\\+\\(js\\|ts\\)(?:$|\\/)');
    });
  });

  describe('ignoredToFunction', () => {
    it('should return a function when given an array of strings', () => {
      const ignoredPatterns = ['foo', 'bar'];
      const fn = ignoredToFunction(ignoredPatterns);
      expect(typeof fn).toBe('function');
      expect(fn('baz.js')).toBeFalsy();
    });
  
    it('should return a function when given a string', () => {
      const ignoredPattern = 'foo';
      const fn = ignoredToFunction(ignoredPattern);
      expect(typeof fn).toBe('function');
      expect(fn('bar.js')).toBeFalsy();
    });
  
    it('should return a function when given a RegExp', () => {
      const ignoredPattern = /foo/;
      const fn = ignoredToFunction(ignoredPattern);
      expect(typeof fn).toBe('function');
      expect(fn('foo.js')).toBeTruthy();
      expect(fn('bar.js')).toBeFalsy();
    });
  
    it('should return the provided function when given a function', () => {
      const customIgnoredFn = (x) => x.startsWith('foo');
      const fn = ignoredToFunction(customIgnoredFn);
      expect(fn).toBe(customIgnoredFn);
      expect(fn('food.js')).toBeTruthy();
      expect(fn('bar.js')).toBeFalsy();
    });
  
    it('should throw an error when given an invalid option', () => {
      expect(() => ignoredToFunction({})).toThrowError(
        'Invalid option for \'ignored\': [object Object]'
      );
    });
  
    it('should return a function that always returns false when no argument is provided', () => {
      const fn = ignoredToFunction();
      expect(typeof fn).toBe('function');
      expect(fn('anyString')).toBeFalsy();
    });
  });

  describe('universalify', () => {
    it('should return a function with the same name as the original function', () => {
      const originalFn = function testFunction() {};
      const universalFn = universalify(originalFn);
      expect(universalFn.name).toBe('testFunction');
    });
  
    it('should call the original function with callback when provided', async () => {
      const mockFn = jest.fn((_, cb) => cb(null, 'success'));
      const universalMockFn = universalify(mockFn);
  
      universalMockFn('arg1', (err, res) => {
        expect(err).toBeNull();
        expect(res).toBe('success');
        expect(mockFn).toHaveBeenCalledWith('arg1', expect.any(Function));
      });
    });
  
    it('should return a Promise when no callback is provided', async () => {
      const mockFn = jest.fn((_, cb) => cb(null, 'success'));
      const universalMockFn = universalify(mockFn);
  
      await expect(universalMockFn('arg1')).resolves.toBe('success');
      expect(mockFn).toHaveBeenCalledWith('arg1', expect.any(Function));
    });
  
    it('should reject the returned Promise when the original callback receives an error', async () => {
      const mockError = new Error('Test error');
      const mockFn = jest.fn((_cb) => _cb(mockError));
      const universalMockFn = universalify(mockFn);
  
      await expect(universalMockFn()).rejects.toEqual(mockError);
      expect(mockFn).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('combinedFn', () => {
    const mockFn1 = jest.fn((...args) => args);
    const mockFn2 = jest.fn((...args) => args);
  
    let combinedMockFn;
  
    beforeEach(() => {
      combinedMockFn = combinedFn(mockFn1, mockFn2);
    });
  
    it('should return a function with the name of fn2', () => {
      expect(combinedMockFn.name).toBe(mockFn2.name);
    });
  
    it('should call fn1 when callback is provided', () => {
      const callback = jest.fn();
      combinedMockFn(1, 2, 3, callback);
  
      expect(mockFn1).toHaveBeenCalledWith(1, 2, 3, expect.any(Function));
      expect(mockFn2).not.toHaveBeenCalled();
  
      // Simulate successful execution of fn1
      (mockFn1.mock.calls[0][3])(null, [1, 2, 3]);
      expect(callback).toHaveBeenCalledWith(null, [1, 2, 3]);
  
      // Simulate failure in fn1
      mockFn1.mockClear();
      combinedMockFn(1, 2, 3, callback);
      (mockFn1.mock.calls[0][3])(new Error('Test error'), null);
      expect(mockFn2).toHaveBeenCalledWith(1, 2, 3, expect.any(Function));
    });
  
    it('should return the result of fn1 if not null and no callback is provided', async () => {
      const expectedResult = 'success';
      mockFn1.mockReturnValueOnce(expectedResult);
  
      const result = await Promise.resolve(combinedMockFn(1, 2, 3));
      expect(result).toBe(expectedResult);
      expect(mockFn1).toHaveBeenCalledWith(1, 2, 3);
    });
  
    it('should call fn2 when fn1 returns null or throws without a callback', () => {
      mockFn1.mockImplementationOnce(() => null);
      combinedMockFn(1, 2, 3);
      expect(mockFn1).toHaveBeenCalledWith(1, 2, 3);
      expect(mockFn2).toHaveBeenCalledWith(1, 2, 3);
  
      mockFn1.mockReset();
      mockFn1.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      combinedMockFn(1, 2, 3);
      expect(mockFn1).toHaveBeenCalledWith(1, 2, 3);
      expect(mockFn2).toHaveBeenCalledWith(1, 2, 3);
    });
  });

  describe('WebpackWrapper', () => {
    let webpackWrapper;
  
    beforeEach(() => {
      webpackWrapper = new WebpackWrapper();
    });
  
    it('should build configuration', () => {
      const config = webpackWrapper.buildConfig();
  
      expect(config).toBeDefined();
    });
  
    it('should prepare webpack instances', () => {
      webpackWrapper.prepare();
  
      expect(webpackWrapper.compiler).toBeDefined();
      expect(webpackWrapper.inputFileSystem).toBeDefined();
    });
  });
})
