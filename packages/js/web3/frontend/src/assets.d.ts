declare module "*.module.scss" {
    const content: Record<string, string>;
    export default content;
}
declare module "*.scss";
declare module "*.css";
declare module "*.css?raw";
declare module "*.jpg";
declare module "*.png";
declare module "*.svg" {
    const svg: SvgIcon;
    export default svg;
}
