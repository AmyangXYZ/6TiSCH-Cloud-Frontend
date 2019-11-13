import axios from 'axios'

var instance = axios.create()

instance.defaults.baseURL = 'http://127.0.0.1:8888'
instance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

instance.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    return response;
  }, function (error) {
    // window.console.log(error)
    return Promise.reject(error);
  });

export default instance