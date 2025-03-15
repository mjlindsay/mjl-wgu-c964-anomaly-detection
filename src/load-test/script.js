import http from 'k6/http';
import { sleep, check } from 'k6';

const REQUESTS_PER_SECOND = 100;

function calculateRatePerSecond(percentage) {
  return REQUESTS_PER_SECOND * percentage
}

export const options = {
  vus: 10,
  scenarios: {
    getAllUsers: {
      exec: 'getAllUsers',
      executor: 'constant-arrival-rate',
      rate: calculateRatePerSecond(0.2),
      duration: '30m',
      preAllocatedVUs: 2
    },
    createUser: {
      exec: 'createUser',
      executor: 'constant-arrival-rate',
      rate: calculateRatePerSecond(0.2),
      duration: '30m',
      preAllocatedVUs: 2
    },
    getSingleUser: {
      exec: 'getSingleUser',
      executor: 'constant-arrival-rate',
      rate: calculateRatePerSecond(0.2),
      duration: '30m',
      preAllocatedVUs: 2
    },
    updateUser: {
      exec: 'updateUser',
      executor: 'constant-arrival-rate',
      rate: calculateRatePerSecond(0.2),
      duration: '30m',
      preAllocatedVUs: 2
    },
    deleteUser: {
      exec: 'deleteUser',
      executor: 'constant-arrival-rate',
      rate: calculateRatePerSecond(0.2),
      duration: '30m',
      preAllocatedVUs: 2
    }
  }
};

export function getAllUsers() {
  let res = http.get('http://localhost:5258/api/User')
}

export function createUser() {
  const payload = JSON.stringify({
    username: 'testuser'
  })

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  let res = http.post('http://localhost:5258/api/User', payload, params)
}

export function getSingleUser() {
  let res = http.get('http://localhost:5258/api/User/5')
}

export function updateUser() {
  const payload = JSON.stringify({
    username: 'testuser'
  })

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  let res = http.put('http://localhost:5258/api/User/5', payload, params)
}

export function deleteUser() {
  let res = http.del('http://localhost:5258/api/User/5')
}
