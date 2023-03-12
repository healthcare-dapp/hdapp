/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Type } from "io-ts";

declare module "axios" {
    interface AxiosRequestConfig<D = any, TA = any, TO = TA, TI = unknown> {
        type?: Type<TA, TO, TI>
    }
}

export interface HttpInstance extends AxiosInstance {
    request<TA, TO = TA, TI = unknown, D = any>(config: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    get<TA, TO = TA, TI = unknown, D = any>(url: string, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    delete<TA, TO = TA, TI = unknown, D = any>(url: string, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    head<TA, TO = TA, TI = unknown, D = any>(url: string, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    options<TA, TO = TA, TI = unknown, D = any>(url: string, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    post<TA, TO = TA, TI = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    put<TA, TO = TA, TI = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    patch<TA, TO = TA, TI = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    postForm<TA, TO = TA, TI = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    putForm<TA, TO = TA, TI = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
    patchForm<TA, TO = TA, TI = unknown, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D, TA, TO, TI>): Promise<TA>
}
