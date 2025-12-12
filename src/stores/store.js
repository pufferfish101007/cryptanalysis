import { deepToRaw } from '../lib/deep-to-raw.js';
import { reactive, ref, toRaw } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useStore = defineStore('store', () => {
  const workspaces = useStorage('workspaces', {});
  const tabs = useStorage('tabs', []);
  const focusedWorkspace = useStorage('focusedWorkspace', '');
  let totalTabs = Object.keys(workspaces.value).length;
  function addWorkspace(args = {}) {
    totalTabs++;
    const id = crypto.randomUUID();
    tabs.value.push(id);
    workspaces.value[id] = {
      ciphertext: args.ciphertext ?? '',
      encoding: args.encoding ?? false,
      ciphermode: args.ciphermode ?? 'plaintext',
      subletters: structuredClone(
        toRaw(args.subletters ?? 'abcdefghijklmnopqrstuvwxyz'.split('')),
      ),
      polySubLetters: structuredClone(
        deepToRaw(
          args.polySubLetters ??
            Array.from({ length: 5 }, (_) =>
              'abcdefghijklmnopqrstuvwxyz'.split(''),
            ),
        ),
      ),
      polyalphabeticPeriod: args.polyalphabeticPeriod ?? 5,
      hillClimbThreshold: args.hillClimbThreshold ?? 2_000,
      hillClimbThreads:
        args.hillClimbThreads ?? window.navigator.hardwareConcurrency,
      hillClimbResultsNum: args.hillClimbResultsNum ?? 1,
      probablePeriod: args.probablePeriod ?? 0,
      probablePeriodThreshold: args.probablePeriodThreshold ?? 20,
      name: args.name ?? `workspace ${totalTabs}`,
      assumeVigenere: args.assumeVigenere ?? false,
      permutation: structuredClone(toRaw(args.permutation ?? [0, 1, 2, 3, 4])),
      vigenereInitialGuess:
        args.vigenereInitialGuess ??
        Array.from({ length: args.polyalphabeticPeriod ?? 5 }, (_) => 'a').join(
          '',
        ),
      useMorsePunct: args.useMorsePunct ?? false,
      playfairKey: structuredClone(
        deepToRaw(
          args.playfairKey ??
            ['abcde', 'fghik', 'lmnop', 'qrstu', 'vwxyz'].map((s) =>
              s.split(''),
            ),
        ),
      ),
    };
  }
  function duplicateWorkspace(id, additionalArgs = {}) {
    addWorkspace(
      Object.assign(
        structuredClone(deepToRaw(workspaces.value[id])),
        additionalArgs,
      ),
    );
  }
  function deleteWorkspace(id) {
    const index = tabs.value.indexOf(id);
    // focusWorkspace(tabs.value.at(index === tabs.length - 1 ? 0 : -1));
    tabs.value.splice(index, 1);
    totalTabs -= 1;
    //focusWorkspace(tabs.at(-1));
    delete workspaces.value[id];
  }
  function renameWorkspace(id, name) {
    workspaces.value[id].name = name;
  }
  //addWorkspace();
  function focusWorkspace(id) {
    focusedWorkspace.value = id;
  }
  if (tabs.value.length === 0) {
    addWorkspace();
  }
  if (!focusedWorkspace.value) {
    focusWorkspace(tabs.value.at(0));
  }
  return {
    workspaces,
    tabs,
    focusedWorkspace,
    addWorkspace,
    duplicateWorkspace,
    focusWorkspace,
    deleteWorkspace,
    renameWorkspace,
  };
});
