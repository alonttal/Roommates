<template>
  <v-container>
    <v-alert :type="alert.type" :value="alert.show" transition="scale-transition">
      {{ alert.message }}
    </v-alert>
    <v-layout>
      <v-flex>
        <v-form v-model="valid">
          <v-text-field label="E-mail" type="email" prepend-icon="email" v-model="payload.email" :rules="rules.email" required></v-text-field>
          <v-text-field label="Password" prepend-icon="lock" v-model="payload.password" :rules="rules.password" :append-icon="showPassword ? 'visibility' : 'visibility_off'" :append-icon-cb="() => (showPassword = !showPassword)" :type="showPassword ? 'text' :'password'" required></v-text-field>
          <v-layout row wrap>
            <v-flex xs12 sm5>
              <v-text-field label="First Name" prepend-icon="person" v-model="payload.firstName" :rules="rules.firstName" required></v-text-field>
            </v-flex>
            <v-flex xs12 sm6 offset-sm1 offset-xs2>
              <v-text-field label="Last Name" v-model="payload.lastName"></v-text-field>
            </v-flex>
          </v-layout>
          <app-calendar-form @dateUpdated="payload.birthdate = new Date($event).getTime()" label="Birthday Date" :required="true" :max="maxBirthdayDate" :start-date="payload.birthdate"/>
          <v-radio-group v-model="payload.gender" row required>
            <v-radio v-for="(gender,i) in genderList" :key="i" :label="gender.title" :value="gender.value"></v-radio>
          </v-radio-group>
          <v-btn @click="register" :disabled="!valid || loading" :loading="loading">
            Register
          </v-btn>
        </v-form>
      </v-flex>
    </v-layout>
  </v-container>

</template>

<script>
import * as EmailValidator from 'email-validator';
import AppCalendarForm from './sub-components/AppCalendarForm';

export default {
  data: () => ({
    valid: true,
    payload: {
      email: null,
      password: null,
      firstName: null,
      lastName: null,
      birthdate: 694224000000,
      gender: null
    },
    rules: {
      email: [
        v => !!v || 'E-mail is required',
        v => (v && EmailValidator.validate(v)) || 'E-mail must be valid'
      ],
      password: [
        v => !!v || 'Password is required',
        v => (v && v.length >= 6) || 'Password must be at least 6 characters'
      ],
      firstName: [
        v => !!v || 'Name is required',
        v => (v && v.length >= 2) || 'Name must be at least 2 characters'
      ]
    },
    showPassword: false,
    genderList: [
      {
        title: 'Male',
        value: 'male'
      },
      {
        title: 'Female',
        value: 'female'
      }
    ],
    alert: {
      show: false,
      message: '',
      type: 'error'
    },
    loading: false
  }),
  methods: {
    showLoading() {
      this.loading = true;
    },
    hideLoading() {
      this.loading = false;
    },
    showSnackbarWelcome(user) {
      this.$store.commit(
        'showSnackbar',
        `Welcome ${
          user.firstName
        }! Check your e-mail for the verification link to complete the registration`
      );
    },
    async register() {
      try {
        this.showLoading();
        await this.$store.dispatch('register', this.payload).then(async (user) => {
          await this.$store.dispatch('sendVerificationMail', {
            email: this.payload.email,
            password: this.payload.password
          });
          this.$router.push({ name: 'AppMain' });
          this.showSnackbarWelcome(user);
        }).catch((e) => {
          this.alert.message = e.response.data;
          this.alert.show = true;
        });
      } catch (error) {
        this.alert.message = 'Unknown error occurred';
        this.alert.show = true;
      } finally {
        this.hideLoading();
      }
    }
  },
  computed: {
    maxBirthdayDate() {
      const date = Date.now() - (18 * 365 * 24 * 60 * 60 * 1000); // 18 years
      return new Date(date).toISOString();
    }
  },
  components: {
    AppCalendarForm
  }
};
</script>

<style scoped>

</style>
