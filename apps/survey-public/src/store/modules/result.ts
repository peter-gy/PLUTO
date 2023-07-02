import { Module } from 'vuex';
import { RootState } from '../index';
import { SurveyResult } from '@pluto/survey-model';
import DUMMY_STATE from './result.state.json';

export interface ResultState {
  result: SurveyResult | null;
}

const result: Module<ResultState, RootState> = {
  namespaced: true,
  state: {
    result: DUMMY_STATE as SurveyResult | null,
  },
  mutations: {
    setResult(state, result: ResultState['result']) {
      state.result = result;
    },
  },
  actions: {
    updateResult({ commit }, result: ResultState['result']) {
      commit('setResult', result);
    },
  },
};

export default result;