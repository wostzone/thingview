<script setup lang="ts">

/**
 * Table of events sorted by name and their latest value
 */

import {TDEventAffordance, ThingTD} from "@/data/thing/ThingTD";
import { ISimpleTableColumn } from "@/components/TSimpleTable.vue";
import TSimpleTable from "../../components/TSimpleTable.vue";
import { ConsumedThing } from "@/data/thing/ConsumedThing";
import { InteractionOutput } from "@/data/thing/InteractionOutput";
import { isoAge } from "@/data/timeAgo";
import { DateTime } from "luxon";
import { h } from "vue";
import TAge from "@/components/TAge.vue";

const props= defineProps<{
  cThing: ConsumedThing
}>()

/** Aggregate info for displaying an event */
interface IEventDisplayInfo {
   /** name of event to show */
   name: string
   /** The event affordance, eg schema of the event */
   ea: TDEventAffordance
   /** latest event value */
   io: InteractionOutput
}


/** return a list of events to show, containing:
 * {
 *    name: string
 *    ea: TDEventAffordance
 *    io: InteractionOutput with latest event value
 * }
 * @param cThing consumed thing whose properties to show
 */
const eventsToShow = (cThing:ConsumedThing): Array<IEventDisplayInfo> => {
  let names = new Array<string>()
  if (cThing.td.events) {
    Object.entries(cThing.td.events).forEach(([name]) => {
        names?.push(name)
    })
  }
  
  let eventList = names.map((name:string)=>{
    let ea = cThing.td.events[name]
    let io = cThing.events.get(name)
    if (!io ) {
      // fake it until it makes it ...
      io = new InteractionOutput("", DateTime.fromSeconds(0))
    }
    return {
      ea: ea,
      name:name,
      io:io
    }
  })
  return eventList
}


// columns to display events (outputs)
const eventColumns = <Array<ISimpleTableColumn>>[
  {title: "Event", field:"name", align:"left",
    sortable:true},
  {title: "Value", field:"io.asText", align: "left"
  },
  {title: "Type", field:"io.schema.type", align: "left"
  },
  {title:"Updated", field:"io.updated", align: "left",
    component: (row:IEventDisplayInfo)=>h(TAge,
     {timeStamp:row.io.updated, showTooltip:true} )
        // [ isoAge(row.io.updated),
        // ])
  }
]

</script>


<template>
  <TSimpleTable row-key="id"
          dense
          :columns="eventColumns"
          :rows="eventsToShow(props.cThing)"
          noDataLabel="This Thing does not define any events"
  />
</template>
