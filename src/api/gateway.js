import axios from './base'

const gateway = {
    getGateway(r) {
        return axios.get(`/api/gateway?range=${r}`)
    },
    getTopology(gw, range) {
        return axios.get(`/api/${gw}/topology?range=${range}`)
    },
    getNWStat(gw, range) {
        return axios.get(`/api/${gw}/nwstat?range=${range}`)
    },
    getNWStatByID(gw, id, range) {
        return axios.get(`/api/${gw}/nwstat/${id}?range=${range}`)
    }
}

export default gateway
            