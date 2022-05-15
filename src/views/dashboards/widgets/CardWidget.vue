<script lang="ts" setup>

/**
 * Dashboard widget that presents a card with a single text value
 */

import { QBtn } from "quasar";
import { matEdit } from "@quasar/extras/material-icons";
import {DashboardTileConfig} from "@/data/dashboard/DashboardStore";
import { ThingFactory } from "@/data/protocolbinding/ThingFactory";
import CardTableWidget from "./CardTableWidget.vue";
import CardTextWidget from "./CardTextWidget.vue";

const props= defineProps<{
  tile:DashboardTileConfig
  thingFactory: ThingFactory
}>()



const emit = defineEmits(["onEditTile"])


</script>

<template>
  <div v-if="props.tile.items && props.tile.items?.length>1"
    class="card-widget"
  >
    <CardTableWidget
        :tile="props.tile"
        :thingFactory="props.thingFactory"
    />
  </div>

  <div v-else-if="props.tile.items?.length==1"
    class="card-widget"
  >
    <CardTextWidget class="card-widget"
      :tile="props.tile"
      :tile-item="props.tile?.items?.[0]"
      :thing-factory="props.thingFactory"
    />
  </div>
  <div v-else class="card-widget">
      <p class="card-value">
        Tile has no items
      </p>
      <QBtn  no-caps padding="sm" color="primary"
        label="Please configure" 
        :icon-right="matEdit"
        @click="emit('onEditTile')" 
      />
  </div>
</template>

<style scoped>

.card-value {
  flex-grow: 1;
  display:flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
}

.card-widget {
  padding: 0px;
  border-style: solid;
  box-shadow: none;
  border: thick black;
  margin: 0px;
  height: 100%;
  width: 100%;
  display:flex;
  flex-direction: column;
  justify-content: center;
}

</style>