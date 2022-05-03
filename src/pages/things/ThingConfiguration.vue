<script setup lang="ts">

import { ConsumedThing } from "@/data/thing/ConsumedThing";
import {ThingTD} from "@/data/thing/ThingTD";
import ThingPropertiesTable from './ThingPropertiesTable.vue';

const props= defineProps<{
  cThing:ConsumedThing
  }>()

</script>

<template>

  <ThingPropertiesTable
          :cThing="props.cThing"
          :propNames="ThingTD.GetConfigurationNames(props.cThing.td)"
          noDataLabel="This Thing has no configuration"
          dense striped
  />

</template>

