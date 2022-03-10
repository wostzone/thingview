<script lang="ts" setup>

import { QTooltip } from 'quasar';
import {VNode} from 'vue'

// This component shows a text with optional tooltip 
const props = defineProps<{
  /**
   * Optional tooltip to show when hovering over the text.
   */
  tooltip?: string|VNode
}>()

</script>


<template>

  <span>
    <!-- Default slot -->
    <slot></slot>
    <QTooltip v-if="tooltip">
      <p>{{props.tooltip}}</p>
      
    </QTooltip>

  </span>
</template>


<style>


</style>