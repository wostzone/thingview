<script setup lang="ts">

import { ThingTD} from "@/data/thing/ThingTD";
import TSimpleTable, { ISimpleTableColumn } from "@/components/TSimpleTable.vue";
import { ConsumedThing } from "@/data/thing/ConsumedThing";

const props= defineProps<{
  cThing: ConsumedThing
  }>()

// columns to display action
const actionColumns = <Array<ISimpleTableColumn>>[
  {title: "Action", field:"title", align:"left", sortable:true},
  // {title: "Description", field:"description", align:"left"
  // },
  {title: "Input", field:"input.title", align:"left"
  },
  // {title: "Data type", field:"input.type", align:"left"
  // },
]

</script>



<template>

  <TSimpleTable row-key="id"
          dense
          :columns="actionColumns"
          :rows="ThingTD.GetThingActions(props.cThing.td)"
          noDataLabel="This Thing does not accept any actions"
  />

</template>