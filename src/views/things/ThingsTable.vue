<script lang="ts" setup>

import { RouterLink } from 'vue-router';
// import {ref} from 'vue'
import {ThingTD} from "@/data/thing/ThingTD";
import {date, QTd} from "quasar";
import TTable, {ITableCol} from '@/components/TTable.vue'
import {matVisibility} from "@quasar/extras/material-icons"
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

// The column field name should match the TD field names
const columns: Array<ITableCol> = [
  // {name: "edit", label: "", field: "edit", align:"center"},
 // Use large width to minimize the other columns
  {name: "id", label: "Thing ID", field:"id" , align:"left", style:"width:400px",
    sortable:true,
    },
  {name: "publisherID", label: "Publisher", field:"publisher" , align:"left",
    sortable:true,
    },
  {name: "deviceID", label: "Device ID", field:"deviceID" , align:"left",
    sortable:true,
    },
  {name: "deviceType", label: "Device Type", field:"deviceType" , align:"left",
    sortable:true,
    },
  {name: "desc", label: "Description", field:"description" , align:"left",
    sortable:true,
    },
  {name: "type", label: "@Type", field:"@type", align:"left", 
    sortable:true,
    },
  {name: "created", label: "Created", field:"created", align:"left", 
    format: (val, row) => getDateText(val),
    sortable:true,
    },
]
// Convert iso9601 date format to text representation 
const getDateText = (iso:string): string => {
  let timeStamp = new Date(iso)
  return formatDate(timeStamp, "ddd YYYY-MM-DD HH:mm:ss (Z)")
}

const visibleColumns = ['deviceID', 'publisherID', 'deviceType', 'desc', 'type', 'created']

</script>


<template>
  <TTable :rows="props.things"
          :columns="columns"
          :visible-columns="visibleColumns"
          row-key="id"
          separator="cell"
          :dense="false"
  >
    <!-- Header style: large and primary -->
    <!-- <template #header-cell="propz">
      <q-th style="font-size:1.1rem;" :props="props">{{propz.col.label}}</q-th>
    </template> -->

    <!-- router-link for viewing the Thing TD -->
    <template v-slot:body-cell-deviceID="propz">
      <QTd style="text-align:left" >
        <a href="" target="_blank" >
          <RouterLink :to="'/things/'+propz.row.id">{{propz.row.deviceID}}</RouterLink>
        </a>
      </QTd>
    </template>


  </TTable>
</template>
