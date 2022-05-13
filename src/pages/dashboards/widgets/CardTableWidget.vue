<script lang="ts" setup>

/**
 * Dashboard tile card that presents values in a table
 */
import {DashboardTileConfig, IDashboardTileItem} from "@/data/dashboard/DashboardStore";
import TileItemsTable from "./TileItemsTable.vue";
import { ThingFactory } from "@/data/protocolbinding/ThingFactory";

/**
 * Card that shows a table of items with text values
 */
const props = defineProps<{
  tile: DashboardTileConfig
  thingFactory: ThingFactory
}>()
</script>


<template>
  <TileItemsTable
      :tileItems="props.tile?.items"
      :thingFactory="props.thingFactory"
      :no-type-col="!props.tile?.showType"
      grow
      flat dense
      noBorder noHeader
  />

</template>

