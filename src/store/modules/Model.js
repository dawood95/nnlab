import utils from '@/lib/utils.js';
const protobuf = require('protobufjs');

const state = () => ({
    model: null,
});

const mutations = {
    setModel: (state, model) => {
       state.model = model;
    },
};

const getters = {
    getModel: (state) => {
        return state.model;
    },
    getModelName: (state) => {
        if (state.model === null) return '';
        return state.model.name;
    },
    getTotalOps: (state) => {
        if (state.model === null) return 0;
        return state.model.totalOps;
    }
};

const actions = {
    async setONNXFromBuffer ({commit, state}, buffer) {
        var model = null;
        protobuf.load('onnx.proto', (err, root) => {
            if (err) throw err;
            var modelProto = root.lookupType('onnx.ModelProto').decode(new Uint8Array(buffer));
            model = utils.loadFromProto(modelProto);
            commit('setModel', model);
        });
    } 
};

export default {state, getters, mutations, actions};