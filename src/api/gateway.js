import axios from './base'

const gateway = {
    getGateway() {
        return axios.get("/api/gateway")
    },
    getTopology(gw) {
        return axios.get(`/api/${gw}/topology`)
    },
    getNWStat(gw) {
        return axios.get(`/api/${gw}/nwstat`)
    },
    getNWStatByID(gw,id) {
        return axios.get(`/api/${gw}/nwstat/${id}`)
    }
}

export default gateway
            