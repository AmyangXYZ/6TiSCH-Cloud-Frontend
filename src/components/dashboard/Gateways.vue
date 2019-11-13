<template>
<vs-card>
    <div slot="header">
    <h3>
        Gateways
    </h3>
    </div>
    <div v-for="gw in gateways" v-bind:key="gw">
        {{gw}}
    </div>
</vs-card>
</template>

<script>

export default {
    data() {
        return {
            gateways: [],
        }
    },
    methods: {    
        getGateway() {
            this.$api.gateway.getGateway()
            .then(res=> {
                 this.gateways = res.data.data
            })
        },
    },
    mounted: function () {
        this.getGateway();
    }
}
</script>