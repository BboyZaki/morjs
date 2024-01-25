'use strict'

const {
  validKeysMessage,
  hexToRgb,
  isLightColor,
  setNPMBinPATH,
  generateQrcodeForTerminal,
  expandExtsWithConditionalExt,
  makeImportClause,
  isCommonJsModule,
  getRelativePath,
  resolveDependency,
  execCommands,
} = require('..');

describe('@morjs/utils - utils.test.js', () => {
  describe('validKeysMessage', () => {
    it('should return correct message when keys is an array', () => {
      const keys = ['值1', '值2']
      const result = validKeysMessage(keys)
      expect(result).toBe('可选值为 值1, 值2')
    })

    it('should return correct message when keys is an object', () => {
      const keys = { key1: '值1', key2: '值2' }
      const result = validKeysMessage(keys)
      expect(result).toBe('可选值为 key1, key2')
    })

    it('should return correct message when keys is a string array', () => {
      const keys = ['值1', '值2']
      const result = validKeysMessage(keys)
      expect(result).toBe('可选值为 值1, 值2')
    })
  })

  describe('hexToRgb', () => {
    it('should convert hex color to rgb', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('should return null for invalid hex color', () => {
      expect(hexToRgb('#zz0000')).toBeNull()
    })

    it('should convert shorthand hex color to rgb', () => {
      expect(hexToRgb('#ff0')).toEqual({ r: 255, g: 255, b: 0 });
      expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
    })
  })

  describe('isLightColor', () => {
    it('should return true for light color', () => {
      expect(isLightColor(255, 255, 255)).toBe(true)
      expect(isLightColor(200, 200, 200)).toBe(true)
    })

    it('should return false for dark color', () => {
      expect(isLightColor(0, 0, 0)).toBe(false)
      expect(isLightColor(50, 50, 50)).toBe(false)
    })
  })

  describe('setNPMBinPATH', () => {
    it('should return the same env when projectPath is an empty string', () => {
      const env = { PATH: '/usr/local/bin:/usr/bin:/bin' }
      expect(setNPMBinPATH('', env)).toEqual(env)
    })

    it('should return the same env when path variable is not present in env', () => {
      const env = { SOME_VAR: 'some value' }
      expect(setNPMBinPATH('/path/to/project', env)).toEqual(env)
    })
  })

  describe('generateQrcodeForTerminal', () => {
    it('should return a promise that resolves with the qrcode string', async () => {
      const input = 'https://example.com'
      const result = await generateQrcodeForTerminal(input)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('expandExtsWithConditionalExt', () => {
    it('should return the original extensions list if no conditional extensions are provided', () => {
      const exts = ['.js', '.jsx'];
      expect(expandExtsWithConditionalExt(exts, undefined)).toEqual(exts);
      expect(expandExtsWithConditionalExt(exts, null)).toEqual(exts);
      expect(expandExtsWithConditionalExt(exts, [])).toEqual(exts);
    })
  
    it('should add conditional extensions to the original list', () => {
      const exts = ['.js', '.jsx'];
      const conditionalExts = '.min';
      expect(expandExtsWithConditionalExt(exts, conditionalExts)).toEqual(['.min.js', '.min.jsx', '.js', '.jsx']);
  
      const multipleConditionalExts = ['.min', '.dev'];
      expect(expandExtsWithConditionalExt(exts, multipleConditionalExts)).toEqual([
        '.min.js', '.min.jsx',
        '.dev.js', '.dev.jsx',
        '.js', '.jsx'
      ]);
    })
  
    it('should handle single string conditional extension in order', () => {
      const exts = ['.js', '.jsx'];
      const conditionalExt = '.min';
      expect(expandExtsWithConditionalExt(exts, conditionalExt)).toEqual(['.min.js', '.min.jsx', '.js', '.jsx']);
    })
  })

  describe('makeImportClause', () => {
    it('should return correct import clause when importName is not provided', () => {
      const moduleKind = 'CommonJS'
      const importPath = './module'
      const expected = `require('./module');\n`
      const result = makeImportClause(moduleKind, importPath)
      expect(result).toEqual(expected)
    })

    it('should return correct import clause when importName is provided but importAs is not provided', () => {
      const moduleKind = 'CommonJS'
      const importPath = './module'
      const importName = 'moduleName'
      const expected = `var moduleName = require('./module');\n`
      const result = makeImportClause(moduleKind, importPath, importName)
      expect(result).toEqual(expected)
    })

    it('should return correct import clause when importName and importAs are provided', () => {
      const moduleKind = 'CommonJS'
      const importPath = './module'
      const importName = 'moduleName'
      const importAs = 'alias'
      const expected = `var alias = require('./module').moduleName;\n`
      const result = makeImportClause(
        moduleKind,
        importPath,
        importName,
        importAs
      )
      expect(result).toEqual(expected)
    })

    it('for ESM module without importName', () => {
      const moduleKind = 'ESNext'
      const importPath = './module'
      const expected = `import './module';\n`
      const result = makeImportClause(moduleKind, importPath)
      expect(result).toEqual(expected)
    })

    it('for ESM module with importName and importAs equal', () => {
      const moduleKind = 'ESNext'
      const importPath = './module'
      const importName = 'moduleName'
      const expected = `import moduleName from './module';\n`
      const result = makeImportClause(moduleKind, importPath, importName)
      expect(result).toEqual(expected)
    })

    it('for ESM module with importName and importAs equal', () => {
      const moduleKind = 'ESNext'
      const importPath = './module'
      const importName = 'moduleName'
      const importAs = 'moduleName'
      const expected = `import { moduleName } from './module';\n`
      const result = makeImportClause(moduleKind, importPath, importName, importAs)
      expect(result).toEqual(expected)
    })

    it('for ESM module with importName and importAs not equal', () => {
      const moduleKind = 'ESNext'
      const importPath = './module'
      const importName = 'moduleName'
      const importAs = 'alias'
      const expected = `import { moduleName as alias } from './module';\n`
      const result = makeImportClause(
        moduleKind,
        importPath,
        importName,
        importAs
      )
      expect(result).toEqual(expected)
    })
  })

  describe('isCommonJsModule', () => {
    it('should return true for CommonJS module', async () => {
      const fileContent = 'const fs = require("fs");'
      const moduleKind = 'CommonJS'
      const result = await isCommonJsModule(fileContent, moduleKind)
      expect(result).toBe(true)
    })

    it('should return false for ES module', async () => {
      const fileContent = 'import fs from "fs";'
      const moduleKind = 'ES2015'
      const result = await isCommonJsModule(fileContent, moduleKind)
      expect(result).toBe(false)
    })

    it('should return false for ES module and large files', async () => {
      const largeFileContent = ''.padEnd(512001, 'a') // 生成一个长度超过500k的字符串
      const moduleKind = 'ESNext'
      const recheckWhenMatched = true
      const result = await isCommonJsModule(
        largeFileContent,
        moduleKind,
        recheckWhenMatched
      )
      expect(result).toBe(false)
    })

    it('should correctly identify CommonJS module even with comments', async () => {
      const fileContentWithComments = `
          // This is a comment
          const fs = require("fs");
          // Another comment
          module.exports = function() {};
      `
      const moduleKind = 'Unknown' // 设置为未知类型，期望通过内容识别为 CommonJS
      const recheckWhenMatched = true

      const result = await isCommonJsModule(
        fileContentWithComments,
        moduleKind,
        recheckWhenMatched
      )
      expect(result).toBe(true)
    })

    // 模拟 esbuild.transform 抛出错误的情况
    it('should return the initial judgment if esbuild.transform fails', async () => {
      const mockTransformError = new Error('Mock esbuild transform error')
      const esbuild = require('esbuild')
      jest.spyOn(esbuild, 'transform').mockRejectedValueOnce(mockTransformError)

      const fileContentWithError = 'const fs = require("fs");'
      const moduleKind = 'CommonJS'
      const recheckWhenMatched = true

      const result = await isCommonJsModule(
        fileContentWithError,
        moduleKind,
        recheckWhenMatched,
      )
      expect(result).toBe(true) // 初始判断为 CommonJS，即使转换失败也应返回初始判断结果
    })
  })

  describe('getRelativePath', () => {
    it('should return relative path with POSIX format by default', () => {
      const from = '/path/to/from'
      const to = '/path/to/file.js'
      const result = getRelativePath(from, to)
      expect(result).toBe('./file.js')
    })

    it('should return relative path with correct prefix for nested directories', () => {
      const from = '/path/to/from'
      const to = '/path/to/nested/file.js'
      const result = getRelativePath(from, to)
      expect(result).toBe('./nested/file.js')
    })
  })

  describe('resolveDependency', () => {
    it('should throw an error if the dependency is not found', () => {
      const depName = 'nonexistent-package'
      expect(() => {
        resolveDependency(depName)
      }).toThrow()
    })
  })

  describe('execCommands', () => {
    it('should execute commands and call callbacks correctly', async () => {
      const mockCommands = ['echo test'];
      const mockBeforeAll = jest.fn();
      const mockBeforeEach = jest.fn().mockResolvedValue({ command: 'mocked cmd' });
  
      await execCommands({
        commands: mockCommands,
        callbacks: {
          beforeAll: mockBeforeAll,
          beforeEach: mockBeforeEach,
        },
        verbose: true,
      });
  
      expect(mockBeforeAll).toHaveBeenCalledWith(mockCommands);
      expect(mockBeforeEach).toHaveBeenCalled();
    });
  
    it('should handle errors correctly', async () => {
      const mockOnError = jest.fn();
  
      await execCommands({
        commands: ['invalid-command'],
        callbacks: { onError: mockOnError },
        throwOnError: false
      });
  
      expect(mockOnError).toHaveBeenCalled();
    });
  })
})
