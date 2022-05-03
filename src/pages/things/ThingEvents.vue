<script setup lang="ts">

import {TDEventAffordance, ThingTD} from "@/data/thing/ThingTD";
import TTable, {ITableCol} from "@/components/TTable.vue";
import { ISimpleTableColumn } from "@/components/TSimpleTable.vue";
import TSimpleTable from "../../components/TSimpleTable.vue";
import { ConsumedThing } from "@/data/thing/ConsumedThing";

const props= defineProps<{
  cThing: ConsumedThing
  }>()

// columns to display events (outputs)
const eventColumns = <Array<ISimpleTableColumn>>[
  {title: "Event", field:"title", align:"left",
    sortable:true},
  {title: "Parameters", field:"data.value", align: "left"
  },
  {title: "Latest", field:"data.updated", align: "left"
  },
]


</script>



<template>
  <TSimpleTable row-key="id"
          dense
          :columns="eventColumns"
          :rows="ThingTD.GetThingEvents(props.cThing.td)"
          noDataLabel="This Thing does not define any events"
  />
</template>
