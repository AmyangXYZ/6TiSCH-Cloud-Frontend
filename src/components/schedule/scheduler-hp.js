/*eslint-disable*/
const RESERVED = 0; // for shared slots
const SUBSLOTS = 8; // for beacon period
const ROWS = 1;
const LINK_OPTION_TX = 0x1
const LINK_OPTION_TX_COAP = 0x21
const LINK_OPTION_RX = 0xA
const LINK_OPTION_ADV = 0x9

// subslot: {offset, period}
function Cell(slot, channel, subslot, sender, receiver, type, layer, link_option) {
  this.slot = slot
  this.channel = channel
  this.subslot = subslot
  this.sender = sender
  this.receiver = receiver
  this.type = type
  this.layer = layer
  this.link_option = link_option
}

const partition_config = require("./partition.json");

function partition_init(sf,resource_req) {
  //Beacon reserved version
  // var u_d = [Math.floor(sf - partition_config.beacon - RESERVED -partition_config.control ) / 2, 
  // Math.floor(sf - partition_config.beacon - RESERVED - partition_config.control) / 2];
  var u_d = [sf, sf]
  // var u_d = [sf-partition_config.beacon,sf-partition_config.beacon]
  // partition_scale(u_d, sf-RESERVED-partition_config.beacon);
  var uplink = partition_config.uplink.slice();
  var downlink = partition_config.downlink.slice();
  var uplink = []
  for(var i=0;i<Object.keys(resource_req).length;i++) {
    uplink.push(resource_req[i].slots+4)
  }

  
  var partition = {
    // broadcast: {},
    // control:{},
  }
  for (var r = 0; r < ROWS; r++) {
    partition[r] = { uplink: {}, downlink: {} }
  }

  var channel_per_row = Math.floor(16 / ROWS)
  var slot_cursor = []
  var uplink_row = []
  var downlink_row = []
  var last_uplink_row_boundary = 0
  var last_downlink_row_boundary = 0

  // partition.control = { start: RESERVED, end: RESERVED+partition_config.control };

  for (var r = 0; r < ROWS; r++) {
    // slot_cursor[r] = partition.control.end
    slot_cursor[r] = RESERVED
    uplink_row[r] = partition_scale(uplink, u_d[0] - last_uplink_row_boundary)
    // uplink_row[r] = uplink
    downlink_row[r] = partition_scale(downlink, u_d[1] - last_downlink_row_boundary);
    last_uplink_row_boundary += uplink_row[r][0]
    last_downlink_row_boundary += downlink_row[r][0]
  }

  //now we have everything scaled by slotframe length
  //and start do the partitioning

  // uplink
  for (var u = uplink.length - 1; u >= 0; --u) {
    for (var r = 0; r < ROWS; r++) {
      var tmp = 0
      // if(r==ROWS-1) tmp=1
      partition[r].uplink[u] = { start: slot_cursor[r], end: slot_cursor[r] + uplink_row[r][u], channels: [r * channel_per_row, (r + 1) * channel_per_row + tmp] }
      slot_cursor[r] += uplink_row[r][u]
    }
  }

  // Beacon
  // partition.broadcast = { start: slot_cursor[0], end: slot_cursor[0] + partition_config.beacon };

  for (var r = 0; r < ROWS; r++) {
    slot_cursor[r] = sf
  }

  // Downlink
  // for (var d = downlink.length - 1; d >= 0; --d) {
  //   for (var r=0;r<ROWS;r++) {
  //     var tmp = 0
  //     // if(r==ROWS-1) tmp=1
  //     partition[r].downlink[d] = {start: slot_cursor[r]-downlink_row[r][d], end: slot_cursor[r], channels:[r*channel_per_row,(r+1)*channel_per_row+tmp]}
  //     slot_cursor[r] -= downlink_row[r][d]
  //   }
  // }
  return partition;
}


function partition_scale(raw_list, size) {
  var list = JSON.parse(JSON.stringify(raw_list));
  //scale the list to the size (sum(list)==size)
  var total = 0;
  for (var i = 0; i < list.length; ++i) {
    total += list[i];
  }
  for (var i = 0; i < list.length; ++i) {
    list[i] = list[i] * size / total;
  }
  //Now we need to arrange them to integers. We cannot directly floor or round or ceil
  //These will cause the sum!=size
  //we do the following 3 for's to round the boundary to closest integers
  for (var i = 1; i < list.length; ++i) {
    list[i] += list[i - 1];
  }
  for (var i = 0; i < list.length; ++i) {
    list[i] = Math.floor(list[i] + 0.5);
  }
  for (var i = list.length - 1; i > 0; --i) {
    list[i] -= list[i - 1];
  }

  return list;
}


// scheduler
function create_scheduler(slotframe, channels) {
  if (!(this instanceof create_scheduler)) {
    return new create_scheduler(slotframe, channels);
  }
  this.slotFrameLength = slotframe;
  this.channels = channels;
  
  this.subpartitions = {}
  this.cell_list = []
  this.schedule_table = new Array(this.slotFrameLength)
  for (var s_i = 0; s_i < this.slotFrameLength; s_i++) {
    this.schedule_table[s_i] = new Array(16);
    for (var c_i in this.channels) {
      this.schedule_table[s_i][this.channels[c_i]] = new Array(SUBSLOTS)
    }
  }

  this.topo = {}
  this.topo_tree = { 0: { id: 0, children: [], traffic: 0 } }

  this.set_topo = function (topo) {
    this.topo = topo
    this.topo_max_layer = 0
    for (var i = 1; i < Object.keys(this.topo).length; i++)
      if (this.topo[i].layer > this.topo_max_layer)
        this.topo_max_layer = this.topo[i].layer

    // build tree
    for (var l = this.topo_max_layer; l >= 0; l--) {
      for (var n = 1; n < Object.keys(this.topo).length; n++) {
        var node = this.topo[n]

        if (node.layer == l) {
          if (this.topo_tree[n] == null) {
            this.topo_tree[n] = { id: n, children: [], traffic: 1 }
          }

          if (this.topo_tree[node.parent] == null) {
            this.topo_tree[node.parent] = {
              id: node.parent, children: [this.topo_tree[n]],
              traffic: 1 + this.topo_tree[n].traffic
            }
          } else {
            this.topo_tree[node.parent].children.push(this.topo_tree[n])
            this.topo_tree[node.parent].traffic += this.topo_tree[n].traffic
          }
        }
      }
    }

    // collect subtree resource requirements
    for (var n = 0; n < Object.keys(this.topo).length; n++) {
      this.topo_tree[n].resource_table = {}
      for (var l = 0; l <= this.topo_max_layer; l++) {
        this.topo_tree[n].resource_table[l] = { slots: 0, channels: 0 }
      }
      if(n!=0) {
        this.topo_tree[n].resource_table[this.topo[n].layer] = {
          slots: this.topo_tree[n].traffic, 
          channels:1 
        }
      }
    }

    for (var l = this.topo_max_layer - 1; l >= -1; l--) {
      for (var n = 0; n < Object.keys(this.topo).length; n++) {
        if (this.topo[n].layer == l) {
          var node = this.topo_tree[n]
          // immediate lower layer, l+1
          if (node.children.length > 0) {
            for (var c in node.children) {
              var child = node.children[c]
              node.resource_table[l + 1].slots += child.traffic
            }

            node.resource_table[l + 1].channels = 1
          }

          // lower layers, >l+1
          for (var ll = l + 2; ll <= this.topo_max_layer; ll++) {
            var max_slots = 0
            var channels = 0
            for (var c in node.children) {
              var child = node.children[c]
              if (child.resource_table[ll].slots > max_slots)
                max_slots = child.resource_table[ll].slots
              channels += child.resource_table[ll].channels
            }
            node.resource_table[ll].slots = max_slots
            node.resource_table[ll].channels = channels
          }


        }
      }
    }
    console.table(this.topo_tree[0].resource_table)
    // for(var i=0;i<Object.keys(this.topo).length;i++) {
    //   console.log(i, JSON.parse(JSON.stringify(this.topo_tree[i].resource_table)))
    // }

    this.partitions = partition_init(slotframe, this.topo_tree[0].resource_table);

    this.allocate_subpartition(0)
    for(var l=0;l<=this.topo_max_layer;l++) {
      for(var n in this.topo) {
        if(this.topo[n].layer == l) {
          this.allocate_subpartition(n)
        }
      }
    }
  }

  // allocate sub-partitions according to resource requirements
  this.allocate_subpartition = function (subtree_root) {
    var requirements = this.topo_tree[subtree_root].resource_table
    var subpartitions = {}
    
    if(subtree_root == 0) {
      for (var i in requirements) {
        var req = requirements[i]
        subpartitions[i] = {
          slot_range: [this.partitions[0].uplink[i].end-req.slots, this.partitions[0].uplink[i].end],
          channel_range: [1, 1+req.channels],
          // for children
          used_channel: 1,
          used_slots: this.partitions[0].uplink[i].end
        }
      }
    } else {
      var parent = this.topo[subtree_root].parent

      for (var i in requirements) {
        var req = requirements[i]
        if(req.slots==0 && req.channels==0) continue
        if(i==this.topo[subtree_root].layer) {
          subpartitions[i] = {
            slot_range: [this.subpartitions[parent][i].used_slots-req.slots, this.subpartitions[parent][i].used_slots],            
            channel_range: this.subpartitions[parent][i].channel_range,
          }
          this.subpartitions[parent][i].used_slots-=req.slots
        } else {

          subpartitions[i] = {
            slot_range: [this.subpartitions[parent][i].slot_range[1]-req.slots, this.subpartitions[parent][i].slot_range[1]],
            channel_range: [this.subpartitions[parent][i].used_channel, this.subpartitions[parent][i].used_channel+req.channels],
            used_channel: this.subpartitions[parent][i].used_channel,
            used_slots: this.partitions[0].uplink[i].end
          }
          this.subpartitions[parent][i].used_channel+=req.channels
        }
      }
    }
    this.subpartitions[subtree_root] = subpartitions
  }

  this.add_cell = function (cell) {
    this.cell_list.push(cell)

    var sub_start = cell.subslot.offset * SUBSLOTS / cell.subslot.period;
    var sub_end = (cell.subslot.offset + 1) * SUBSLOTS / cell.subslot.period;
    for (var sub = sub_start; sub < sub_end; sub++) {
      this.schedule_table[cell.slot][cell.channel][sub] = cell
    }
  }

  this.is_available = function (cell) {
    return true
  }

  // node_list: [sender, receiver]
  // info: {type, layer, link_option}
  this.find_idle_cell = function (node_list, info) {
    var node = node_list[0]
    var parent = node_list[1]
    if (info.type == "downlink") {
      node = node_list[1]
      parent = node_list[0]
    }

    if (info.type == "beacon") {
      return new Cell(60, 4, { offset: 0, period: 1 }, 1, 2, 'uplink', 1, LINK_OPTION_TX)
    }

    // find sub_partition

    // find a random idle cell
  }

}

module.exports = {
  create_scheduler: create_scheduler,
};
