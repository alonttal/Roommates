<template>
<v-container fluid grid-list-lg>
  <v-layout row wrap v-if="loaded">
    <v-flex xs12 sm12 md9 order-xs2 order-md1>
      <v-card>
        <v-tabs height="60" icons-and-text centered dark color="primary">
          <v-tabs-slider color="yellow"></v-tabs-slider>
          <v-tab v-for="(tab,i) in tabs" :href="`#tab-${i+1}`" :key="`t-${i}`">
            {{ tab.title }}
            <v-icon>{{ tab.icon }}</v-icon>
          </v-tab>

          <v-tab-item  id="tab-1">
            <div v-if="edit">
              <app-publish-apartment edit flat v-model="v" @updated="edit = false" @cancel="edit = false"/>
            </div>
            <v-card v-else>
              <v-card-media contain :height="400" class="grey lighten-4">
                <app-image-gallery v-model="v.images"/>
              </v-card-media>
              <v-card-text>
                <v-card-title class="caption py-0 grey--text">
                  This Ad is From: {{ new Date(v.entranceDate).toDateString() }}
                  <v-spacer/>
                  <a v-if="isVerified && getUser._id === p._id" @click="edit = true">Edit</a>
                  </v-card-title>
                <v-layout wrap row align-center>
                  <v-flex xs12 sm8>
                    <v-card-title class="title py-0">
                      <app-map-icon :location="location" class="pb-3"/>
                      {{ address }}
                      <v-chip v-if="isClosedDeal" color="red" text-color="white">Deal Closed!</v-chip>
                    </v-card-title>
                  </v-flex>
                  <v-flex xs12 sm4>
                    <v-card-title class="title py-0">&#x24;{{ v.price }}</v-card-title>
                  </v-flex>
                  <v-flex xs12>
                    <v-card-title class="py-0 pl-3"><span class="body-2 pr-1">Entrance Date: </span>{{ new Date(v.entranceDate).toDateString() }}
                </v-card-title>
                  <v-divider/>
                  </v-flex>
                  <v-flex xs12 sm12 md7 mt-3>
                    <v-layout wrap row>
                      <v-flex xs12>
                        <v-card>
                          <v-card-title><h4>Utilities</h4></v-card-title>
                          <v-divider/>
                          <app-tag-list v-model="v.tags"/>
                        </v-card>
                      </v-flex>
                      <v-flex xs12 mt-3>
                        <v-card>
                          <v-card-title><h4>About</h4></v-card-title>
                          <v-divider></v-divider>
                          <v-card-text>
                            <i>{{ about }}</i>
                          </v-card-text>
                        </v-card>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                  <v-flex xs12 sm12 md4 offset-md1>
                    <app-attribute-list v-model="attributes" />
                  </v-flex>
                </v-layout>
              </v-card-text>
            </v-card>
          </v-tab-item>

          <v-tab-item id="tab-2">
            <app-group-full v-if="isVerified" :apartmentId="v._id" :ownerId="v._createdBy" :requiredRoommates="v.requiredRoommates" :interestedList="v._interested"/>
             <v-card height="500" v-if="!isVerified">
              <div class="text-xs-center pt-3">This option is available for verified users only.</div>
            </v-card>
          </v-tab-item>

          <v-tab-item id="tab-3">
            <app-reviews :lat="v.location.geolocation[1]" :lng="v.location.geolocation[0]" :city="v.location.address.city" :street="v.location.address.street"/>
          </v-tab-item>

          <v-tab-item id="tab-4">
            <v-card height="500">
              <app-comments :comments="v.comments" :onComment="addComment"/>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </v-card>
    </v-flex>
    <v-flex xs12 sm12 md3 order-xs1 order-md2>
      <v-layout wrap row>
        <v-flex xs12>
          <v-toolbar color="primary" dark :height="60 ">
            <v-toolbar-title>Publisher</v-toolbar-title>
            <v-spacer/>
              <app-share-icon v-if="loaded" left :url="share.url" :title="share.title" :description="share.description" :quote="share.quote"
                email
                facebook
                googleplus
                twitter
                whatsapp/>
            </v-toolbar>
          <app-publisher-details v-model="p"/>
        </v-flex>
        <v-flex xs12 v-if="isVerified">
          <v-card class="mt-3" style="max-height: 400px">
            <v-card-actions>
              <v-list-tile>
                <v-list-tile-action>
                  <v-switch color="purple" :input-value="v._notificationSubscribers.includes(getUser._id)" @change="toggleSubscription"></v-switch>
                </v-list-tile-action>
                <v-list-tile-title>Enable notifications</v-list-tile-title>
              </v-list-tile>
            </v-card-actions>
            <v-slide-y-transition mode="out-in">
            <v-divider/>
            </v-slide-y-transition>
          </v-card>
        </v-flex>
        <v-flex xs12>
          <v-card class="mt-3" style="max-height: 400px">
            <v-card-actions>
              <app-favorite-icon large v-model="v._interested" :apartment-id="v._id"/>
              {{ interestTitle }}
              <v-spacer/>
              <v-btn icon @click.native="expendInterested = !expendInterested">
              <v-icon>{{ expendInterestedIcon }}</v-icon>
              </v-btn>
            </v-card-actions>
            <v-slide-y-transition mode="out-in">
              <v-card-text v-show="expendInterested" class="pa-0">
              <v-divider/>
              <app-favor-list :favors="v._interested"/>
              </v-card-text>
            </v-slide-y-transition>
          </v-card>
        </v-flex>
        <v-flex xs12 v-if="$vuetify.breakpoint.mdAndUp">
          <v-card>
            <app-recommended-list :geolocation="v.location.geolocation" :filtered="[v._id]"/>
          </v-card>
        </v-flex>
      </v-layout>
    </v-flex>
    <v-flex xs12 v-if="$vuetify.breakpoint.smAndDown" order-xs3>
      <v-card>
        <app-recommended-list :geolocation="v.location.geolocation" :filtered="[v._id]"/>
      </v-card>
    </v-flex>
  </v-layout>
</v-container>
</template>

<script>
import { mapGetters } from 'vuex';
import AppImageGallery from './Galleries/AppImageGallery';
import AppAttributeList from './Lists/AppAttributeList';
import AppTagList from './Lists/AppTagList';
import AppMapIcon from './Icons/AppMapIcon';
import AppPublisherDetails from './Lists/AppPublisherDetails';
import AppFavorList from './Lists/AppFavorList';
import AppComments from './Comments/AppComments';
import AppReviews from './AppReviews';
import AppGroupFull from './Groups/AppGroupFull';
import AppFavoriteIcon from './Icons/AppFavoriteIcon';
import AppRecommendedList from './Lists/AppRecommendedList';
import AppPublishApartment from './AppPublishApartment';
import AppShareIcon from './Icons/AppShareIcon';

export default {
  props: {
    apartment: {
      type: Object,
      default: null
    },
    publisher: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loaded: false,
      v: null,
      p: null,
      expendInterested: this.$vuetify.breakpoint.smAndUp,
      CONST_GROUP_STATUS_COMPLETED: 4,
      edit: false,
      tabs: [
        {
          icon: 'list_alt',
          title: 'Details'
        },
        {
          icon: 'group',
          title: 'Groups'
        },
        {
          icon: 'rate_review',
          title: 'Reviews'
        },
        {
          icon: 'comment',
          title: 'Comments'
        }
      ]
    };
  },
  methods: {
    addComment(comment) {
      return this.$store.dispatch('addApartmentComment', {
        params: {
          id: this.v._id
        },
        payload: {
          text: comment.text
        }
      });
    },
    toggleSubscription() {
     return this.$store.dispatch('toggleSubscription', {id:this.v._id})
        .then((apartment) => {this.v._notificationSubscribers = apartment._notificationSubscribers; });
    },
    fetchApartment(id) {
      return this.$store.dispatch('fetchApartments', { id })
      .then((apartment) => {
        this.v = apartment[0];
      });
    },
    fetchPublisher(id) {
      return this.$store.dispatch('fetchUser', { id })
      .then((users) => {
        this.p = users[id];
      });
    }
  },
  computed: {
    ...mapGetters(['isVerified', 'getUser']),
    attributes() {
      return [
        {
          title: 'required roommates',
          value: this.v.requiredRoommates
        },
        {
          title: 'total roommates',
          value: this.v.totalRoommates
        },
        {
          title: 'floor',
          value: this.v.floor
        },
        {
          title: 'total floors',
          value: this.v.totalFloors
        },
        {
          title: 'rooms number',
          value: this.v.numberOfRooms
        },
        {
          title: 'area (square meter)',
          value: this.v.area
        }
      ];
    },
    about() {
      return this.v.description || "The owner hasn't added any additional details";
    },
    address() {
      return `${this.v.location.address.street.capitalize()} ${this.v.location.address.number}, ${this.v.location.address.city.capitalize()}`;
    },
    isClosedDeal(){
      return this.v && this.v.groups.length > 0 && this.v.groups.some(g => g.status == this.CONST_GROUP_STATUS_COMPLETED);
    },
    location() {
      return {
        longitude: this.v.location.geolocation[0],
        latitude: this.v.location.geolocation[1]
      };
    },
    interestTitle() {
      if (this.v._interested.length === 0) {
        return 'Be The First To Express Interest!';
      }
      return `${this.v._interested.length} People Have Expressed Interest`;
    },
    expendInterestedIcon() {
      return this.expendInterested ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
    },
    share() {
      return {
        url: `${process.env.ROOT_API}/App/apartments/${this.v._id}`,
        title: 'Sharing this apartment I found on Roommates with you!',
        description: `Located in ${this.address}, price: ${this.v.price}`,
        quote: 'This is an apartment that I thought might interest you.'
      };
    }
  },
  created() {
    if (!this.apartment) {
      this.$store.commit('showLoading');
      this.fetchApartment(this.$route.params.id)
        .then(() => this.fetchPublisher(this.v._createdBy))
        .then(() => { this.loaded = true; })
        .catch(e => console.log(e)) // eslint-disable-line
        .then(() => this.$store.commit('hideLoading'));
    } else if (!this.publisher) {
      this.$store.commit('showLoading');
      this.v = this.apartment;
      this.fetchPublisher(this.v._createdBy)
        .then(() => { this.loaded = true; })
        .catch(e => console.log(e)) // eslint-disable-line
        .then(() => this.$store.commit('hideLoading'));
    } else {
      this.v = this.apartment;
      this.p = this.publisher;
      this.loaded = true;
    }
  },
  components: {
    AppImageGallery,
    AppAttributeList,
    AppTagList,
    AppMapIcon,
    AppPublisherDetails,
    AppFavorList,
    AppComments,
    AppReviews,
    AppGroupFull,
    AppFavoriteIcon,
    AppRecommendedList,
    AppPublishApartment,
    AppShareIcon
  }
};
</script>

<style scoped>
</style>
