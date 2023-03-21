---
title: The Proof of the ssim_end1() in FFmpeg
reward: false
date: 2020-02-18 09:41:36
authors:
  - 王伟
  - 姚贤杰
categories:
  - IVQA
tags: 
  - FFmpeg
  - SSIM
---
这篇文章是对[FFmpeg中计算SSIM算法](https://github.com/FFmpeg/FFmpeg/blob/master/tests/tiny_ssim.c)中用到的公式的证明。其中的$fs1$，$fs2$，$fs12$，$fss$的含义和FFmpeg保持一致，具体可以参考[FFmpeg如何计算图像的SSIM](/2020/02/15/how-to-calculate-the-SSIM-in-FFmpeg/)中的说明。

<!--more-->

$$
\begin{aligned}

SSIM(a,b)&=\frac{(2\mu_a\mu_b+C_1)(2\sigma_{ab}+C_2)}{(\mu_a^2+\mu_b^2+C_1)(\sigma_a^2+\sigma_b^2+C_2)} \\

\mu_a&=\frac{1}{64}fs1 \\

\mu_b&=\frac{1}{64}fs2 \\

\sigma_a^2+\sigma_b^2&=\frac{1}{63}(\sum_{i,j}(a(i,j)-\mu_a)^2 + \sum_{i,j}(b(i,j)-\mu_b)^2) \\

&=\frac{1}{63}\sum_{i,j}(a(i,j)^2+\mu_a^2-2 \cdot a(i,j) \cdot \mu_a+b(i,j)^2+\mu_b^2-2 \cdot b(i,j) \cdot \mu_b) \\

&=\frac{1}{63}(\sum_{i,j}(a(i,j)^2+b(i,j)^2)-2(\mu_a\sum_{i,j}a(i,j)+\mu_b\sum_{i,j}b(i,j))+\sum_{i,j}
(\mu_a^2+\mu_b^2)) \\

&=\frac{1}{63}(fss-2 \cdot \frac{1}{64}(fs1^2+fs2^2)+\frac{1}{64}(fs1^2+fs2^2) \\

&=\frac{1}{63}(fss-\frac{1}{64}(fs1^2+fs2^2)) \\

&=\frac{1}{63}\frac{1}{64}(64fss-fs1^2-fs2^2) \\

\sigma_{ab}&=\frac{1}{63}\sum_{i,j}((a(i,j)-\mu_a)(b(i,j)-\mu_b)) \\

&=\frac{1}{63}\sum_{i,j}(a(i,j) \cdot b(i,j)-a(i,j)\mu_b-b(i,j)\mu_a+\mu_a \cdot \mu_b) \\

&=\frac{1}{63}(fs12-fs1 \cdot \mu_b-fs2 \cdot \mu_a+fs1 \cdot \mu_b) \\

&=\frac{1}{63}(fs12-\frac{1}{64}fs1 \cdot fs2) \\

&=\frac{1}{63}\frac{1}{64}(64fs12-fs1 \cdot fs2) \\

\therefore SSIM(a,b)&=\frac{(2fs1 \cdot fs2+64^2C_1)(2 \cdot 64fs12-2fs1fs2+63 \cdot 64C_2)}{(fs1^2+fs2^2+64^2C_1)(64fss-fs1^2-fs2^2+63 \cdot 64C_2)}

\end{aligned}
$$