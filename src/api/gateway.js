import axios from './base'

const gateway = {
    getGateway(range) {
        return axios.get(`/api/gateway?range=${range}`)
    },
    getTopology(gw, range) {
        return axios.get(`/api/${gw}/topology?range=${range}`)
    },
    getNWStat(gw, range) {
        return axios.get(`/api/${gw}/nwstat?range=${range}`)
    },
    getNWStatByID(gw, id, range, adv) {
        return axios.get(`/api/${gw}/nwstat/${id}?range=${range}&advanced=${adv}`)
    },
    getChInfoByID(gw, id, range) {
        return axios.get(`/api/${gw}/nwstat/${id}/channel?range=${range}`)
    },
    getBattery(gw, range) {
        return axios.get(`/api/${gw}/battery?range=${range}`)
    },
    getBatteryByID(gw, id, range) {
        return axios.get(`/api/${gw}/battery/${id}?range=${range}`)
    },
    getNoiseLevel(gw, range) {
        return axios.get(`/api/${gw}/noise?range=${range}`)
    }
}

export default gateway
            