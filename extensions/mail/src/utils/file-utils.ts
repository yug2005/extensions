import fs from "fs";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import mime from "mime-types";

export const getMIMEtype = (extension: string | undefined): string | undefined => {
  if (!extension) return undefined;
  const mimeType: string | false = mime.lookup(extension);
  if (mimeType) return mimeType.split("/")[0];
  else return undefined;
};

export const formatFileSize = (size: string): string => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  let i = parseInt(size);
  if (i < 0) return "0";
  let j = 0;
  while (i > 1024) {
    i /= 1024;
    j++;
  }
  return i.toFixed(1) + " " + sizes[j];
};

type FileSize = {
  label: string;
  value: number;
};

export const maximumFileSize: FileSize = {
  label: "36 MB",
  value: 35.9 * 10 ** 6,
};

export const getSize = async (paths: string[]): Promise<number> => {
  const promises = paths
    .filter((path: string) => fs.existsSync(path))
    .map(async (path: string) => {
      const item = fs.statSync(path);
      if (item.isFile()) {
        return item.size;
      } else {
        return getDirectorySize(path, 0);
      }
    });
  const sizes = await Promise.all(promises);
  const size = sizes.reduce((a: number, b: number) => a + b, 0);
  return size;
};

export const validateSize = async (paths: string[]): Promise<boolean> => {
  const size = await getSize(paths);
  return size < maximumFileSize.value;
};

const maximumRecursionDepth = 4;
export const getDirectorySize = async (dir: string, depth: number) => {
  if (depth > maximumRecursionDepth) return 0;
  const files = await readdir(dir, { withFileTypes: true });
  const paths: Promise<number>[] = files.map(async (file) => {
    const path = join(dir, file.name);
    if (file.isDirectory()) return await getDirectorySize(path, depth + 1);
    if (file.isFile()) {
      const { size } = await stat(path);
      return size;
    }
    return 0;
  });
  return (await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
};
