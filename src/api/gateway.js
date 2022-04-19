import axios from './base'

const gateway = {
    getGateway(range) {
        return axios.get(`/api/gateway?range=${range}`)
    },
    getTopology(gw, range) {
        return axios.get(`/api/${gw}/topology?range=${range}`)
    },
    getTopoHistory() {
        return axios.get(`/api/any/topology/history`)
    },
    getSchedule() {
        return axios.get(`/api/any/schedule`)
    },
    getPartition() {
        return axios.get(`/api/any/schedule/partition`)
    },
    getPartitionHARP() {
        return axios.get(`/api/any/schedule/partition_harp`)
    },
    getSubPartitionHARP() {
        return axios.get(`/api/any/schedule/sp_harp`)
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
    },
    getTxTotal() {
        return axios.get(`/api/any/txtotal?range=year`)
    },
    getSensorsByID(id, range) {
        return axios.get(`/api/any/${id}/sensors?range=${range}`)
    },
    putSamplingRate(id,type,rate) {
        return axios.put(`/api/any/${id}/sensors/${type}?rate=${rate}`)
    }
}

export default gateway
            