import SparkMD5 from 'spark-md5';

export const md5 = (s: string): string => SparkMD5.hash(s);
