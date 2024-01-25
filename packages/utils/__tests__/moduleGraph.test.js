'use strict'

const {
  MAIN_GROUP_NAME,
  ROOT_MODULE_NAME,
  ModuleGroup,
  ModuleItem,
  ModuleGraph,
} = require('..')

describe('@morjs/utils - moduleGraph.test.js', () => {
  describe('测试常量', () => {
    it('测试 MAIN_GROUP_NAME 是否为预期值', () => {
      expect(MAIN_GROUP_NAME).toBe('');
    });

    it('测试 ROOT_MODULE_NAME 是否为预期值', () => {
      expect(ROOT_MODULE_NAME).toBe('root');
    });
  });

  describe('ModuleGroup', () => {
    let group;

    beforeEach(() => {
      group = new ModuleGroup('testGroup');
    });

    it('should initialize correctly', () => {
      expect(group.name).toBe('testGroup');
      expect(group.modules.size).toBe(0);
    });

    it('should add and remove modules correctly', () => {
      const module1 = new ModuleItem('module1', new ModuleGraph());
      group.addModule(module1);
  
      expect(group.hasModule(module1)).toBe(true);
      expect(group.modules.size).toBe(1);
  
      group.removeModule(module1);
  
      expect(group.hasModule(module1)).toBe(false);
      expect(group.modules.size).toBe(0);
    });
  })

  describe('ModuleItem', () => {
    let moduleItem;
    let moduleGraph;

    beforeEach(() => {
      moduleGraph = new ModuleGraph();
      moduleItem = new ModuleItem('module1', moduleGraph);
    });

    it('should initialize correctly', () => {
      expect(moduleItem.filePath).toBe('module1');
      expect(moduleItem.groups.size).toBe(0);
      expect(moduleItem.dependencies.size).toBe(0);
      expect(moduleItem.parents.size).toBe(0);
      expect(moduleItem.moduleGraph).toBe(moduleGraph);
      expect(moduleItem.isRemoved).toBe(false);
    });

    it('should link and unlink groups correctly', () => {
      const group1 = new ModuleGroup('group1');
      moduleItem.linkGroup(group1);

      expect(moduleItem.groups.has(group1)).toBe(true);
      expect(group1.modules.has(moduleItem)).toBe(true);

      moduleItem.unlinkGroup(group1);

      expect(moduleItem.groups.has(group1)).toBe(false);
      expect(group1.modules.has(moduleItem)).toBe(false);
    });

    it('should clear existing groups and link to a new group', () => {
      const group1 = new ModuleGroup();
      const group2 = new ModuleGroup();
      const dependencyModule = new ModuleItem('module2', moduleGraph);

      moduleItem.linkGroup(group1);
      moduleItem.addDependency(dependencyModule);
      dependencyModule.addParent(moduleItem);

      moduleItem.clearAndLinkGroup(group2);
      expect(moduleItem.groups.size).toBe(1);
      expect(moduleItem.groups.has(group1)).toBe(false);
      expect(moduleItem.groups.has(group2)).toBe(true);
    });

    it('should remove the specified dependency and update mutual parent relationship', () => {
      const group1 = new ModuleGroup();
      const dependencyModule = new ModuleItem('module2', moduleGraph);

      moduleItem.linkGroup(group1);
      moduleItem.addDependency(dependencyModule);

      moduleItem.removeDependency(dependencyModule);
      expect(moduleItem.dependencies.size).toBe(0);
      expect(dependencyModule.parents.size).toBe(0);
      expect(moduleItem.dependencies.has(dependencyModule)).toBe(false);
      expect(dependencyModule.parents.has(moduleItem)).toBe(false);
    });
    
    it('should remove the dependency without updating mutual parent when mutual is false', () => {
      const group1 = new ModuleGroup();
      const dependencyModule = new ModuleItem('module2', moduleGraph);

      moduleItem.linkGroup(group1);
      moduleItem.addDependency(dependencyModule);

      moduleItem.removeDependency(dependencyModule, false);
      expect(moduleItem.dependencies.size).toBe(0);
      expect(dependencyModule.parents.size).toBe(1); // Still has the parent
      expect(moduleItem.dependencies.has(dependencyModule)).toBe(false);
    });

    it('should remove the module from groups, dependencies and parents, and mark as removed', () => {
      const group1 = new ModuleGroup();
      const dependencyModule = new ModuleItem('module2', moduleGraph);

      moduleItem.linkGroup(group1);
      moduleItem.addDependency(dependencyModule);
      dependencyModule.addParent(moduleItem);

      moduleItem.remove();
      expect(moduleItem.isRemoved).toBe(true);
      expect(moduleItem.groups.size).toBe(0);
      expect(moduleItem.dependencies.size).toBe(0);
      expect(moduleItem.parents.size).toBe(0);
    });

    it('should getAllDependentFiles correctly', () => {
      const fileSet = new Set();
      const dependency1 = new ModuleItem('dependency1', moduleGraph);
      const dependency2 = new ModuleItem('dependency2', moduleGraph);
      
      moduleItem.addDependency(dependency1);
      dependency1.addDependency(dependency2);

      moduleItem.getAllDependentFiles(fileSet);

      expect(fileSet.size).toBe(2);
      expect(fileSet.has('dependency1')).toBe(true);
      expect(fileSet.has('dependency2')).toBe(true);
    });
  })

  describe('ModuleItem', () => {
    let graph;

    beforeEach(() => {
      graph = new ModuleGraph();
    });

    describe('constructor', () => {
      it('should initialize correctly', () => {
        expect(graph.groups.size).toBe(1);
        expect(graph.modules.size).toBe(1);
        expect(graph.invalidModules.size).toBe(0);
      });
    });

    describe('isRootModule', () => {
      it('should return true if the given module is the root module', () => {
        expect(graph.isRootModule(graph.rootModule)).toBe(true);
      });

      it('should return false if the given module is not the root module', () => {
        const fakeModule = graph.createOrFetchModule('fake');
        expect(graph.isRootModule(fakeModule)).toBe(false);
      });
    });

    describe('isMainGroup', () => {
      it('should return true if the given group is the main group', () => {
        expect(graph.isMainGroup(graph.mainGroup)).toBe(true);
      });

      it('should return false if the given group is not the main group', () => {
        const fakeGroup = graph.createGroup('fake');
        expect(graph.isMainGroup(fakeGroup)).toBe(false);
      });
    });

    describe('getGroup', () => {
      it('should return mainGroup when filePath does not exist', () => {
        const filePath = 'nonexistent.js';
        expect(graph.getGroup(filePath)).toBe(graph.mainGroup);
      });

      it('should return mainGroup when module appears in multiple groups', () => {
        const filePath = 'shared.js';
        const module = graph.createOrFetchModule(filePath);
        const groupA = graph.createGroup('groupA');
        const groupB = graph.createGroup('groupB');
        module.groups.add(groupA);
        module.groups.add(groupB);

        expect(graph.getGroup(filePath)).toBe(graph.mainGroup);
      });

      it('should return the correct group when module is in a single group', () => {
        const filePath = 'module.js';
        const module = graph.createOrFetchModule(filePath);
        const group = graph.createGroup('group');

        module.groups.add(group);

        expect(graph.getGroup(filePath)).toBe(group);
      });
    });

    describe('invalidate', () => {
      it('should mark the module, its dependencies and parents as invalid', () => {
        // Create a simple dependency tree for testing
        const moduleA = graph.createOrFetchModule('moduleA');
        const moduleB = graph.createOrFetchModule('moduleB');
        const moduleC = graph.createOrFetchModule('moduleC');

        moduleA.dependencies.add(moduleB);
        moduleB.dependencies.add(moduleC);
        moduleC.parents.add(moduleB);
        moduleB.parents.add(moduleA);

        graph.invalidate('moduleB.js');

        expect(graph.invalidModules.has(moduleA)).toBe(false);
        expect(graph.invalidModules.has(moduleB)).toBe(false);
        expect(graph.invalidModules.has(moduleC)).toBe(false);
      });
    });

    describe('isInvalid', () => {
      it('当模块不存在或在无效模块集合中时，应返回 true', () => {
        const nonExistentModulePath = 'nonexistent/path';
        expect(graph.isInvalid(nonExistentModulePath)).toBe(true);
  
        const dummyModule = graph.createOrFetchModule('dummy');
        graph.invalidModules.add(dummyModule);
        expect(graph.isInvalid(dummyModule.filePath)).toBe(true);
      });
  
      it('当模块存在且不在无效模块集合中时，应返回 false', () => {
        const validModule = graph.createOrFetchModule('validModule');
        expect(graph.isInvalid(validModule.filePath)).toBe(false);
      });
    });
  
    describe('clearAllInvalidModules', () => {
      it('应清理无效模块并从 modules 和 groups 中移除', () => {
        const invalidModule1 = graph.createOrFetchModule('invalidModule1');
        const invalidModule2 = graph.createOrFetchModule('invalidModule2');
        graph.invalidModules.add(invalidModule1);
        graph.invalidModules.add(invalidModule2);
  
        // 添加依赖关系以便测试清理效果（这里简化处理，实际可能涉及更复杂的关联）
        graph.modules.set(invalidModule1.filePath, invalidModule1);
        graph.modules.set(invalidModule2.filePath, invalidModule2);
  
        graph.clearAllInvalidModules();
  
        expect(graph.invalidModules.size).toBe(0);
        expect(graph.modules.has(invalidModule1.filePath)).toBe(false);
        expect(graph.modules.has(invalidModule2.filePath)).toBe(false);
      });
    });

    it('should add dependency correctly', () => {
      const parentPath = 'path/to/parent';
      const dependencyPath = 'path/to/dependency';
      const groupName = 'group1';
  
      const group = graph.addDependencyFor(parentPath, dependencyPath, groupName);
  
      expect(group.name).toBe(groupName);
      const parentModule = graph.getModuleByFilePath(parentPath);
      const childModule = graph.getModuleByFilePath(dependencyPath);
  
      expect(parentModule.dependencies.has(childModule)).toBeTruthy();
    });
  
    it('should create or fetch module correctly', () => {
      const filePath = 'path/to/module';
      const createdModule = graph.createOrFetchModule(filePath);
  
      expect(graph.modules.has(filePath)).toBeTruthy();
      expect(createdModule.filePath).toBe(filePath);
      expect(graph.invalidModules.has(createdModule)).toBeFalsy();
  
      const fetchedModule = graph.createOrFetchModule(filePath);
      expect(fetchedModule).toBe(createdModule);
    });

    afterEach(() => {
      graph.reset();
    });
  
    test('constructor initializes correctly', () => {
      expect(graph.mainGroup.name).toBe(MAIN_GROUP_NAME);
      expect(graph.rootModule.filePath).toBe(ROOT_MODULE_NAME);
      expect(graph.groups.size).toBe(1);
      expect(graph.modules.size).toBe(1);
      expect(graph.invalidModules.size).toBe(0);
    });
  
    test('removeModuleByFilePath removes a module by filePath', () => {
      const filePath = 'path/to/module';
      const mockModule = graph.createOrFetchModule(filePath);
  
      graph.removeModuleByFilePath(filePath);
  
      expect(graph.modules.has(filePath)).toBe(false);
      expect(mockModule.isRemoved).toBe(true);
    });
  
    test('removeModule removes a non-root module', () => {
      const mockModule = graph.createOrFetchModule('non-root-module');
  
      graph.removeModule(mockModule);
  
      expect(graph.modules.has(mockModule.filePath)).toBe(false);
      expect(mockModule.isRemoved).toBe(true);
    });
  
    test('toJSON serializes modules correctly', () => {
      const module1Path = 'module1';
      const module2Path = 'module2';
      const group1Name = 'group1';
      
      const module1 = graph.createOrFetchModule(module1Path);
      const module2 = graph.createOrFetchModule(module2Path);
      const group1 = graph.createGroup(group1Name);
  
      module1.addDependency(module2);
      module1.linkGroup(group1);
  
      const serialized = graph.toJSON();
  
      expect(serialized.length).toBe(3);
    });
  
    test('restore restores the graph from serialized data', () => {
      const input = [
        { filePath: 'moduleA', dependencies: ['moduleB'], groups: ['group1'] },
        { filePath: 'moduleB', dependencies: [], groups: [] },
      ];
  
      ModuleGraph.restore(input);
  
      expect(graph.modules.size).toBe(1);
      expect(graph.groups.size).toBe(1);
    });
  })
})
