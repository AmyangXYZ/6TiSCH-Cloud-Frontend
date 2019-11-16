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
    }
}

export default gateway
            