<script lang="ts" setup>

import { RouterLink } from "vue-router";
import {ThingTD} from "@/data/td/ThingTD";
import {date} from "quasar";
import {matVisibility} from "@quasar/extras/material-icons"
import TSimpleTable, { ISimpleTableColumn } from "@/components/TSimpleTable.vue";
import { h } from "vue";
import {ThingsRouteName} from "@/router";
import { PropNameName } from "@/data/td/Vocabulary";
// use formatDate without pulling in the rest of quasar
const {formatDate} = date

// Accounts table API
interface IThingsTable {
  // Collection of things
  things: Array<ThingTD>
  // optional title to display above the table
  title?: string
}
const props = defineProps<IThingsTable>()


const emit = defineEmits([
  'onViewDetails'
])

// Get the 'name' of a Thing
// this returns the value of its 'name' property
const getThingName = (td:ThingTD): string => {
  let tdProp = ThingTD.GetThingProperty(td, PropNameName)
  return tdProp? tdProp.value : ""
}

// The column field name should match the TD field names
const columns: Array<ISimpleTableColumn> = [
  // {name: "edit", label: "", field: "edit", align:"center"},
  // Use large width to minimize the other columns
  {title: "Name", field:"name" , align:"left", width:"200px",
    component: (row:any) => h('span', {}, getThingName(row))
  },
  {title: "Thing ID", field:"id" , align:"left", width:"400px", hidden:true,
  },
  {title: "Publisher", field:"publisher" , align:"left",
  },
  {title: "Device ID", field:"deviceID" , align:"left",
    component: (row:any) => h(RouterLink, {
      // FIXME: use route name and property instead of hard coded path
      to: "/things/"+row.id
      },
      ()=>row.deviceID
    )
  },
  {title: "Device Type", field:"deviceType" , align:"left",
  },
  {title: "Description", field:"description" , align:"left",// width:"50%",
  },
  {title: "@Type", field:"@type", align:"left", 
  },
  {title: "Created", field:"created", align:"left", 
    component: (row: ThingTD) => h('span',{}, getDateText(row.created)),
  },
]
// Convert iso9601 date format to text representation 
const getDateText = (iso:string): string => {
  let timeStamp = new Date(iso)
  return formatDate(timeStamp, "ddd YYYY-MM-DD HH:mm:ss (Z)")
}
</script>


<template>
  <TSimpleTable
    :rows="props.things"
    :columns="columns"
    row-key="id"
    :dense="false"
  />
</template>
