<template>
  <div>
    <v-app light>
      <v-toolbar fixed app>
        <v-toolbar-title v-text="title" />
      </v-toolbar>
      <v-content>
        <v-container v-scroll="onScroll" fluid>
          <v-layout row wrap>
            <v-flex xs12> </v-flex>
          </v-layout>
        </v-container>
      </v-content>
      <v-footer fixed app>
        <div v-if="offsetTop > 300" class="back-btn-wrapper">
          <v-btn
            fab="fab"
            dark="dark"
            color="primary"
            @click="$vuetify.goTo('#introduction', options)"
          >
            <v-icon dark="dark">keyboard_arrow_up</v-icon>
          </v-btn>
        </div>
      </v-footer>
    </v-app>
  </div>
</template>

<script>
export default {
  data() {
    return {
      offsetTop: 0,
      title: "Online Product Order Flow",
    }
  },
  methods: {
    onScroll() {
      this.offsetTop = window.pageYOffset || document.documentElement.scrollTop
    },
  },
}
</script>

<style lang="scss" scoped></style>
