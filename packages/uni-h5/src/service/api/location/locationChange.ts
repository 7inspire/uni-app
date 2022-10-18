import {
  defineAsyncApi,
  defineOnApi,
  defineOffApi,
  API_START_LOCATION_UPDATE,
  API_TYPE_START_LOCATION_UPDATE,
  StartLocationUpdateProtocol,
  StartLocationUpdateOptions,
  API_ON_LOCATION_CHANGE,
  API_TYPE_ON_LOCATION_CHANGE,
  API_TYPE_STOP_LOCATION_UPDATE,
  API_STOP_LOCATION_UPDATE,
  API_TYPE_OFF_LOCATION_CHANGE,
  API_OFF_LOCATION_CHANGE,
  API_TYPE_OFF_LOCATION_CHANGE_ERROR,
  API_OFF_LOCATION_CHANGE_ERROR,
  API_TYPE_ON_LOCATION_CHANGE_ERROR,
  API_ON_LOCATION_CHANGE_ERROR,
} from '@dcloudio/uni-api'
import { translateGeo } from '../../../helpers/location'

let watchId: number = 0

/**
 * 开始更新定位
 */
export const startLocationUpdate =
  defineAsyncApi<API_TYPE_START_LOCATION_UPDATE>(
    API_START_LOCATION_UPDATE,
    (_, { resolve, reject }) => {
      if (navigator.geolocation && watchId === 0) {
        watchId = navigator.geolocation.watchPosition(
          (res) => {
            translateGeo(_?.type, res.coords)
              .then((coords) => {
                UniServiceJSBridge.invokeOnCallback(
                  API_ON_LOCATION_CHANGE,
                  coords
                )
                resolve()
              })
              .catch((error) => {
                reject(error.message)
              })
          },
          (error) => {
            reject(error.message)
          }
        )
      }
      resolve()
    },
    StartLocationUpdateProtocol,
    StartLocationUpdateOptions
  )

export const onLocationChange = defineOnApi<API_TYPE_ON_LOCATION_CHANGE>(
  API_ON_LOCATION_CHANGE,
  () => {}
)

export const stopLocationUpdate = defineAsyncApi<API_TYPE_STOP_LOCATION_UPDATE>(
  API_STOP_LOCATION_UPDATE,
  (_, { resolve, reject }) => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      watchId = 0
      resolve()
    } else {
      reject('stopLocationUpdate:fail')
    }
  }
)

export const offLocationChange = defineOffApi<API_TYPE_OFF_LOCATION_CHANGE>(
  API_OFF_LOCATION_CHANGE,
  () => {
    stopLocationUpdate()
  }
)

export const onLocationChangeError =
  defineOnApi<API_TYPE_ON_LOCATION_CHANGE_ERROR>(
    API_ON_LOCATION_CHANGE_ERROR,
    () => {}
  )

export const offLocationChangeError =
  defineOnApi<API_TYPE_OFF_LOCATION_CHANGE_ERROR>(
    API_OFF_LOCATION_CHANGE_ERROR,
    () => {}
  )
