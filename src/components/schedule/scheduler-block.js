/*eslint-disable*/
/*
 * Copyright (c) 2016, Texas Instruments Incorporated
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * *  Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * *  Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * *  Neither the name of Texas Instruments Incorporated nor the names of
 *    its contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* APIs:
  this.find_empty_subslot=function(nodes_list, period, info)
  this.add_subslot=function(slot,subslot,cell)
  this.remove_node=function(node)
  this.dynamic_partition_adjustment()
*/


const RESERVED = 4; //Number of reserved
const SUBSLOTS = 8;



function create_scheduler(sf, ch, algorithm) {
  /*
  Slot = {slot_offset, channel}
  Subslot = {period, offset}
  Cell = {type, layer, row, sender, receiver}
  
  used_subslot = {slot: [slot_offset, ch_offset], subslot: [periord, offset], cell: cell, is_optimal:1}
  */
  if (!(this instanceof create_scheduler)) {
    return new create_scheduler(sf, ch, algorithm);
  }

  // window.console.log("create_scheduler("+sf+","+ch+")", algorithm);
  this.slotFrameLength = sf;
  this.channels = ch;
  this.algorithm = algorithm
  this.schedule = new Array(sf);
  const BEACON_BLOCK = [RESERVED, RESERVED+20]
  this.BEACON_BLOCK = [Math.floor((sf+RESERVED)/2-8),Math.floor((sf+RESERVED)/2+8)]
  // mainly for send cells to cloud
  this.used_subslot = []
  this.isFull = false;
  this.nonOptimalCount = 0;
  for (var i = 0; i < sf; ++i) {
    this.schedule[i] = new Array(16);
  }
  for (var c in this.channels) {
    var ch = this.channels[c];
    for (var slot = 0; slot < this.slotFrameLength; ++slot) {
      this.schedule[slot][ch] = new Array(SUBSLOTS)
    }
  }


  this.setTopology = function (topo) {
    this.topo = topo
  }

  this.add_slot = function (slot, cell) {
    this.add_subslot(slot, { offset: 0, period: 1 }, cell);
  }

  this.add_subslot = function (slot, subslot, cell, is_hard) {
    var sub_start = subslot.offset * SUBSLOTS / subslot.period;
    var sub_end = (subslot.offset + 1) * SUBSLOTS / subslot.period;

    for (var sub = sub_start; sub < sub_end; ++sub) {
      this.schedule[slot.slot_offset][slot.channel_offset][sub] = {
        type: cell.type,
        layer: cell.layer,
        sender: cell.sender,
        receiver: cell.receiver,
      }
    }

    this.used_subslot.push({ slot: [slot.slot_offset, slot.channel_offset], subslot: [subslot.offset, subslot.period], cell: cell, hard: is_hard })


  }

  this.remove_slot = function (slot) {
    this.remove_subslot(slot, { offset: 0, period: 1 });
  }

  this.remove_subslot = function (slot, subslot) {
    var sub_start = subslot.offset * SUBSLOTS / subslot.period;
    var sub_end = (subslot.offset + 1) * SUBSLOTS / subslot.period;
    for (var sub = sub_start; sub < sub_end; ++sub) {
      this.schedule[slot.slot_offset][slot.channel_offset][sub] = null;
    }

    for (var i = 0; i < this.used_subslot.length; i++) {
      if (this.used_subslot[i].slot[0] == slot.slot_offset &&
        this.used_subslot[i].slot[1] == slot.channel_offset &&
        this.used_subslot[i].subslot[0] == subslot.offset &&
        this.used_subslot[i].subslot[1] == subslot.period) {
        this.used_subslot.splice(i, 1)
        i--
      }
    }
  }

  // remove used subslot by sender, receiver, type
  this.remove_usedsubslot = function (sender, receiver, type) {
    for (var i = 0; i < this.used_subslot.length; i++) {
      if (this.used_subslot[i].cell.sender == sender &&
        this.used_subslot[i].cell.receiver == receiver &&
        this.used_subslot[i].cell.type == type) {
        this.used_subslot.splice(i, 1)
        i--
      }
    }
  }

  //3-d filter
  this.available_subslot = function (nodes_list, slot, subslot, info) {
    if (slot.slot_offset < RESERVED) return false;

    //if is beacon, we want it always the first channel in the list;
    //it actually doesn't matter since hardware-wise it's hardcoded to beacon channel
    //but to make it consistant in scheduler table...
    if (info.type == "beacon") {
      if (slot.channel_offset != this.channels[0] || slot.slot_offset<this.BEACON_BLOCK[0] || slot.slot_offset>=this.BEACON_BLOCK[1]) {
        return false
      }
    } 

    //check if this slot-channel is assigned
    var sub_start = subslot.offset * SUBSLOTS / subslot.period;
    var sub_end = (subslot.offset + 1) * SUBSLOTS / subslot.period;
    for (var sub = sub_start; sub < sub_end; ++sub) {
      if (this.schedule[slot.slot_offset][slot.channel_offset][sub] != null)
        return false;
    }

    //check if this slot (any channel) is assigned to beacon
    //or is assigned to the members
    for (var c in this.channels) {
      var ch = this.channels[c];
      for (var sub = sub_start; sub < sub_end; ++sub) {
        if (this.schedule[slot.slot_offset][ch][sub] == null)
          continue;
        //KILBYIIOT-6, beacon is no longer monitored after association:  
        //Tao: this is added back, since it can cause potential conflict
        if (this.schedule[slot.slot_offset][ch][sub].type == "beacon") return false;
        if (nodes_list.indexOf(this.schedule[slot.slot_offset][ch][sub].sender) != -1) return false;
        if (nodes_list.indexOf(this.schedule[slot.slot_offset][ch][sub].receiver) != -1) return false;
      }
    }
    return true;
  }

  // find the first(uplink)/last(downlink) used slot of the node
  this.find_cell = function (node, type) {
    for (var i = 0; i < this.used_subslot.length; i++) {
      if (type == "uplink") {
        if (this.used_subslot[i].cell.sender == node && this.used_subslot[i].cell.type == type && this.used_subslot[i].hard) {
          return this.used_subslot[i]
        }
      } else if (type == "downlink") {
        if (this.used_subslot[i].cell.receiver == node && this.used_subslot[i].cell.type == type && this.used_subslot[i].hard) {
          return this.used_subslot[i]
        }
      }
    }
    console.log("cannot find this cell", node, type)
  }

  //generate a shuffled slot list to iterate
  this.shuffle_slots = function () {
    var shuffled_slots = [];
    for (var slot = 0; slot < this.slotFrameLength; ++slot) {
      for (var c in this.channels) {
        var ch = this.channels[c];
        shuffled_slots.push({ slot_offset: slot, channel_offset: ch });
      }
    }
    for (var i = shuffled_slots.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = shuffled_slots[i];
      shuffled_slots[i] = shuffled_slots[j];
      shuffled_slots[j] = temp;
    }
    var schedule = this.schedule;
    //pass into sort(func)
    //sort the shuffled list by subslot occupation
    shuffled_slots.sort(function (a, b) {
      var ca = 0, cb = 0;
      var a_sublist = schedule[a.slot_offset][a.channel_offset];
      var b_sublist = schedule[b.slot_offset][b.channel_offset];
      for (var sub = 0; sub < SUBSLOTS; ++sub) {
        if (a_sublist[sub] == null) {
          ++ca;
        }
        if (b_sublist[sub] == null) {
          ++cb;
        }
      }
      return ca - cb;
    });
    return shuffled_slots;
  }

  //3-d searcher
  this.find_empty_subslot = function (nodes_list, period, info) {
    var slots_list = []
    if(info.type == "beacon") {
      for(var i=this.BEACON_BLOCK[0]; i<this.BEACON_BLOCK[1]; i++) {
        slots_list.push({slot_offset:i, channel_offset:1})
      }
    } else {
      if(info.type == "uplink") {
        var parent = nodes_list[1]
        var start = this.BEACON_BLOCK[0]
        
        // 5 is the max hop here
        var block_width = 1
        if(info.layer!=0)
          start = this.find_cell(parent,info.type).slot[0]
        for(var s=start-1;s>RESERVED;s-=block_width) {
          for(var c_i=0;c_i<this.channels.length;c_i++) {
            var ch = this.channels[c_i]
            slots_list.push({slot_offset:s, channel_offset: ch})
          }
        }
      }
    }


    for (var i = 0; i < slots_list.length; ++i) {
      var slot = slots_list[i];
      for (var offset = 0; offset < period; ++offset) {
        if (this.available_subslot(nodes_list, slot, { period: period, offset: offset }, info)) {
          return { slot: slot, subslot: { offset: offset, period: period}, hard: true}
        }
      }
    }
   

    this.isFull = true;
    return { slot: { slot_offset: 5, channel_offset: 10 }, row: 0, subslot: { offset: 0, period: 16 }, is_optimal: 0 };
  }

  this.remove_node = function (node) {
    for (var slot = 0; slot < this.slotFrameLength; ++slot) {
      for (var c in this.channels) {
        var ch = this.channels[c];
        for (var sub = 0; sub < SUBSLOTS; ++sub) {
          if (this.schedule[slot][ch][sub] != null) {
            if (
              this.schedule[slot][ch][sub].sender == node ||
              this.schedule[slot][ch][sub].receiver == node
            ) {
              // console.log("schedule["+slot+"]["+ch+"]["+sub+"] cleaned");
              this.schedule[slot][ch][sub] = null;
            }
          }
        }
      }
    }
    for (var i = 0; i < this.used_subslot.length; i++) {
      if (this.used_subslot[i].cell.sender == node || this.used_subslot[i].cell.receiver == node) {
        this.used_subslot.splice(i, 1)
        // array length will change
        i--
      }
    }
  }

  this.periodOffsetToSubslot = function (periodOffset, period) {
    return periodOffset * ((SUBSLOTS / period) % SUBSLOTS);
  }
}

module.exports = {
  create_scheduler: create_scheduler,
  SUBSLOTS: SUBSLOTS
};
