import { requireEnv } from '@cbrl/env'
import { AuthTypes, Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector'
import type { PoolConfig } from 'pg'
import type { IamAuth } from './index'

export type CloudSqlIamEnv = {
  /** Env var that, when `'true'`, switches the pool to IAM auth, e.g. `APP_USE_IAM_AUTH`. */
  readonly enabledEnvVar: string
  /** Env var holding the instance connection name (`project:region:instance`). */
  readonly instanceEnvVar: string
  /** Env var holding the IAM DB user: the runtime SA email without `.gserviceaccount.com`. */
  readonly userEnvVar: string
}

/**
 * Passwordless Cloud SQL auth: the Cloud SQL Node connector dials the instance's
 * private IP and authenticates with the runtime service account's IAM token.
 * The SA needs `roles/cloudsql.client` + `roles/cloudsql.instanceUser` and must
 * exist as a database IAM user.
 */
export function cloudSqlIam(env: CloudSqlIamEnv): IamAuth {
  return {
    enabledEnvVar: env.enabledEnvVar,
    connect: async () => {
      const connector = new Connector()
      const options: PoolConfig = await connector.getOptions({
        instanceConnectionName: requireEnv(env.instanceEnvVar),
        authType: AuthTypes.IAM,
        ipType: IpAddressTypes.PRIVATE,
      })
      return {
        options: { ...options, user: requireEnv(env.userEnvVar) },
        close: () => connector.close(),
      }
    },
  }
}
