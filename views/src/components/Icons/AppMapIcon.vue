<template>
  <div class="text-xs-center">
    <v-btn icon @click.native="openMap" :class="color">
      <v-icon>place</v-icon>
    </v-btn>
    <app-map v-model="showMap" :center="location"></app-map>
  </div>
</template>

<script>
import AppMap from '../Maps/AppMap';

export default {
  props: {
    color: {
      type: String,
      default: 'pink--text'
    },
    location: {
      type: Object,
      default: () => ({
        longitude: 0,
        latitude: 0
      })
    }
  },
  data() {
    return {
      showMap: false
    };
  },
  methods: {
    openMap() {
      this.showMap = true;
    }
  },
  components: {
    AppMap
  }
};
</script>

<style>
</style>
