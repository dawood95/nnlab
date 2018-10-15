const state = {
  tabs: [
    {
      name: 'Overview',
      route: 'overview',
    },
  ],
};

const getters = {
  getTabs: state => state.tabs,
};

const mutations = {
  push(state, tab) {
    state.tabs.push(tab);
  },
};

const actions = {};

export default {
  state,
  getters,
  mutations,
  actions,
};
