import Vue from 'vue';
import 'vue-awesome/icons';
import BootstrapVue from 'bootstrap-vue';
import Icon from 'vue-awesome/components/Icon.vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import VueResource from 'vue-resource';

import '@/../static/css/style.css';
import App from './App.vue';
import router from './router';
import Auth from '@/auth/Auth.js'

require('../static/js/string-utils.js');

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(Icon);
Vue.use(VueResource);
Vue.use(Auth);

Icon.register({
    balcony: {
        width: 1810,
        height: 1810,
        paths: [
            {
                d: 'M82 1798 c-8 -8 -12 -48 -12 -115 l0 -103 30 0 30 0 0 -285 0 -285 -53 0 c-29 0 -58 -5 -65 -12 -15 -15 -15 -51 0 -66 9 -9 220 -12 889 -12 784 0 879 2 893 16 39 38 5 74 -70 74 l-54 0 0 285 0 285 25 0 c25 0 25 0 25 99 0 55 -3 106 -6 115 -6 14 -86 16 -813 16 -614 0 -810 -3 -819 -12z m1558 -103 l0 -25 -740 0 -740 0 0 25 0 25 740 0 740 0 0 -25z m-1340 -400 l0 -285 -45 0 -45 0 0 285 0 285 45 0 45 0 0 -285z m190 0 l0 -285 -55 0 -55 0 0 285 0 285 55 0 55 0 0 -285z m180 0 l0 -285 -50 0 -50 0 0 285 0 285 50 0 50 0 0 -285z m190 0 l0 -285 -55 0 -55 0 0 285 0 285 55 0 55 0 0 -285z m190 0 l0 -285 -55 0 -55 0 0 285 0 285 55 0 55 0 0 -285z m170 0 l0 -285 -45 0 -45 0 0 285 0 285 45 0 45 0 0 -285z m190 0 l0 -285 -55 0 -55 0 0 285 0 285 55 0 55 0 0 -285z m180 0 l0 -285 -50 0 -50 0 0 285 0 285 50 0 50 0 0 -285z'
            },
            {
                d: 'M140 862 c-60 -66 -65 -112 -20 -197 24 -45 29 -65 24 -91 -6 -33 -5 -34 25 -34 39 0 39 -10 2 -31 -28 -17 -88 -105 -78 -115 11 -11 69 28 87 59 l20 32 0 -35 c0 -37 -14 -69 -26 -58 -13 13 -46 -13 -41 -32 3 -14 -1 -20 -16 -22 -28 -4 -34 -34 -12 -58 9 -10 14 -24 10 -30 -10 -16 15 -41 39 -39 12 1 29 -1 39 -6 24 -10 47 1 47 22 0 10 10 23 22 28 28 12 34 38 13 58 -8 9 -15 27 -15 41 0 23 -9 31 -32 27 -7 -1 -1 22 9 42 3 4 12 -1 21 -12 9 -10 29 -27 45 -36 27 -17 27 -17 27 10 0 29 -48 85 -74 85 -12 0 -16 10 -16 35 0 31 3 35 26 35 23 0 26 3 21 26 -3 18 7 52 30 101 44 92 41 128 -14 185 -33 34 -42 38 -88 38 -42 0 -54 -5 -75 -28z m66 -553 c9 -15 -11 -33 -30 -26 -9 4 -13 13 -10 22 7 17 30 20 40 4z'
            },
            {
                d: 'M430 452 c0 -320 3 -431 12 -440 17 -17 899 -17 916 0 9 9 12 120 12 440 l0 428 -45 0 -45 0 0 -200 0 -200 -170 0 -170 0 0 200 0 200 -40 0 -40 0 0 -200 0 -200 -170 0 -170 0 0 200 0 200 -45 0 -45 0 0 -428z m430 -212 l0 -150 -170 0 -170 0 0 150 0 150 170 0 170 0 0 -150z m420 0 l0 -150 -170 0 -170 0 0 150 0 150 170 0 170 0 0 -150z'
            }
        ]
    },
    elevator: {
        width: 4840,
        height: 4840,
        paths: [
            {
                d: 'M739 4611 l-39 -39 0 -1750 0 -1751 31 -35 c17 -20 47 -40 67 -46 51 -14 3193 -14 3244 0 20 6 50 26 67 46 l31 35 0 1751 0 1750 -39 39 -39 39 -1642 0 -1642 0 -39 -39z m3151 -1791 l0 -1580 -1470 0 -1470 0 0 1580 0 1580 1470 0 1470 0 0 -1580z"'
            },
            {
                d: 'M1435 4313 c-35 -9 -63 -33 -79 -68 -14 -29 -16 -119 -16 -779 0 -513 3 -761 11 -798 25 -116 113 -229 221 -282 219 -106 491 15 563 250 13 42 15 165 15 817 0 837 2 803 -57 843 -26 18 -51 19 -333 21 -168 0 -314 -1 -325 -4z'
            },
            {
                d: 'M2780 4314 c-40 -14 -62 -30 -80 -60 -19 -30 -20 -53 -20 -795 0 -850 -2 -825 68 -929 81 -119 196 -181 337 -181 141 0 257 62 337 182 69 103 68 87 68 927 0 826 2 798 -58 839 -24 16 -56 18 -332 20 -168 1 -312 0 -320 -3z'
            },
            {
                d: 'M1630 2303 c-155 -54 -265 -195 -277 -356 -19 -257 212 -471 465 -429 91 15 163 55 232 128 80 86 104 149 105 274 0 83 -3 102 -28 154 -52 112 -141 192 -251 229 -62 21 -185 21 -246 0z'
            },
            {
                d: 'M2965 2302 c-56 -20 -127 -66 -166 -109 -112 -121 -141 -298 -72 -443 36 -79 115 -160 189 -196 242 -118 532 34 576 302 29 174 -66 350 -231 428 -57 27 -79 31 -156 33 -65 2 -104 -2 -140 -15z'
            },
            {
                d: 'M1089 771 c-35 -34 -39 -44 -39 -87 l0 -49 318 -317 317 -318 53 0 c29 0 65 6 80 14 15 8 160 149 323 313 306 308 317 322 302 384 -16 63 -65 99 -134 99 -42 0 -45 -2 -301 -257 l-258 -257 -243 240 c-133 133 -253 249 -267 258 -13 9 -44 16 -68 16 -38 0 -50 -6 -83 -39z'
            },
            {
                d: 'M3014 781 c-21 -16 -166 -156 -321 -312 -293 -296 -308 -316 -296 -383 3 -15 19 -40 35 -56 26 -27 36 -30 91 -30 l61 0 253 252 253 253 243 -242 c133 -132 252 -246 264 -252 12 -6 45 -11 73 -11 46 0 56 4 86 34 29 29 34 41 34 82 l0 49 -323 322 -322 323 -46 0 c-35 0 -55 -7 -85 -29z'
            }
        ]
    }
});

Vue.http.options.root = process.env.SERVER_URI;
Vue.http.headers.common['x-auth'] = 'x-auth';
Vue.http.interceptors.push((request, next) => {
    next();
});

// router.beforeEach(
//   (to, from, next) => {
//     if (to.matched.some(record => record.meta.forVisitors)) {
//       if (Vue.auth.isAuthenticated()) {
//         console.log('authenticated')
//         next({ name: 'main-page' });
//       } else {
//         next();
//       }
//     } else if (to.matched.some(record => record.meta.forAuth)) {
//       if (!Vue.auth.isAuthenticated()) {
//         console.log('not authenticated')
//         next({ name: 'identification' });
//       } else {
//         next();
//       }
//     } else {
//       next();
//     }
//   }
// );

new Vue({
    el: '#app',
    router,
    template: '<App />',
    components: { App }
});
