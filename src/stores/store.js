import { deepToRaw } from '../lib/deep-to-raw.js';
import { reactive, ref, toRaw } from 'vue';
import { defineStore } from 'pinia';

export const useStore = defineStore('store', () => {
  const workspaces = reactive({});
  const tabs = reactive([]);
  const focusedWorkspace = ref('');
  let totalTabs = 0;
  function addWorkspace(args = {}) {
    console.log(args.subletters);
    totalTabs++;
    const id = crypto.randomUUID();
    tabs.push(id);
    workspaces[id] = reactive({
      ciphertext: args.ciphertext ?? '',
      encoding: args.encoding ?? false,
      ciphermode: args.ciphermode ?? 'plaintext',
      subletters: reactive(
        structuredClone(
          toRaw(args.subletters ?? 'abcdefghijklmnopqrstuvwxyz'.split('')),
        ),
      ),
      polySubLetters: reactive(
        structuredClone(
          deepToRaw(
            args.polySubLetters ??
              Array.from({ length: 5 }, (_) =>
                'abcdefghijklmnopqrstuvwxyz'.split(''),
              ),
          ),
        ),
      ),
      polyalphabeticPeriod: args.polyalphabeticPeriod ?? 5,
      hillClimbThreshold: args.hillClimbThreshold ?? 2_000,
      hillClimbThreads: args.hillClimbThreads ?? window.navigator.hardwareConcurrency,
      hillClimbResultsNum: args.hillClimbResultsNum ?? 1,
      probablePeriod: args.probablePeriod ?? 0,
      probablePeriodThreshold: args.probablePeriodThreshold ?? 20,
      name: args.name ?? `workspace ${totalTabs}`,
      assumeVigenere: args.assumeVigenere ?? false,
      permutation: reactive(structuredClone(toRaw(args.permutation ?? [0,1,2,3,4]))),
    });
    console.log(workspaces[id].subletters);
  }
  function duplicateWorkspace(id, additionalArgs = {}) {
    console.log(id, additionalArgs, toRaw(workspaces[id]));
    addWorkspace(
      Object.assign(structuredClone(deepToRaw(workspaces[id])), additionalArgs),
    );
  }
  function deleteWorkspace(id) {
    const index = tabs.indexOf(id);
    focusWorkspace(tabs.at(index === tabs.length - 1 ? 0 : -1));
    tabs.splice(index, 1);
    console.log(tabs)
    //focusWorkspace(tabs.at(-1));
    delete workspaces[id];
  }
  addWorkspace();
  focusedWorkspace.value = tabs[0];
  function focusWorkspace(id) {
    console.log(id, workspaces[id]);
    focusedWorkspace.value = id;
  }
  return {
    workspaces,
    tabs,
    focusedWorkspace,
    addWorkspace,
    duplicateWorkspace,
    focusWorkspace,
    deleteWorkspace,
  };
});
