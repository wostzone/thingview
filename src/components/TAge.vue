<script lang="ts" setup>
import { timeAgo, currentTime } from "@/data/timeAgo";
import { DateTime } from "luxon";
import { QTooltip } from "quasar";

/**
 * Text field showing the age based on the current time
 * Optional tooltip with the exact date and time
 */
const props = defineProps<{
  /** The ISO8601 timestamp whose age to show */
  timeStamp: DateTime,
  /** optionally show a tooltip */
  showTooltip?: boolean
}>()

</script>


<template>
<span>
  {{timeAgo(props.timeStamp, currentTime)}}
  <QTooltip style="font-size: inherit;">{{props.timeStamp.toRFC2822()}}</QTooltip>
  </span>
</template>