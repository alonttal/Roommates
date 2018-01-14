import Vue from 'vue';
import Router from 'vue-router';

import MainPage from '@/components/pages/Main'
import Identification from '@/components/pages/Identification'
import ApartmentPage from '@/components/pages/Apartment'
import UserProfilePage from '@/components/pages/UserProfile'
import AddApartmentPage from '@/components/pages/AddApartment'
import InterestedApartments from '@/components/pages/InterestedApartments'
import UserPanel from '@/components/pages/UserPanel'
import HobbiesSelection from '@/components/pages/HobbiesSelection'

Vue.use(Router);

const routes = [
    {
        path: '/',
        name: 'main-page',
        component: MainPage
    },
    {
        path: '/identification',
        name: 'identification',
        component: Identification,
        meta: { forVisitors: true }
    },
    {
        path: '/apartments/:id',
        name: 'apartment-page',
        component: ApartmentPage
    },
    {
        path: '/add',
        name: 'add-apartment-page',
        component: AddApartmentPage,
        meta: { forAuth: true }
    },
    {
        path: '/users/:id/interested',
        name: 'interested-apartments',
        component: InterestedApartments
    },
    {
        path: '/users/hobbies',
        name: 'select-hobbies',
        component: HobbiesSelection,
        props: true
    },
    {
        path: '/users/:id/profile',
        name: 'user-profile',
        component: UserProfilePage,
        props: true
    },
    {
        path: '/users/control-panel',
        name: 'user-panel',
        component: UserPanel,
        meta: { forAuth: true }
    },

];

const beforeEach = (to, from, next) => {
    if (to.matched.some(record => record.meta.forVisitors)) {
        if (Vue.auth.isAuthenticated()) {
            console.log('authenticated')
            next({ name: 'main-page' });
        } else {
            next();
        }
    } else if (to.matched.some(record => record.meta.forAuth)) {
        if (!Vue.auth.isAuthenticated()) {
            console.log('not authenticated')
            next({ name: 'identification' });
        } else {
            next();
        }
    } else {
        next();
    }
};

export default new Router({
    routes,
    beforeEach
});
