---
title: github commit messages中的emoji使用指南
reward: false
top: false
date: 2021-05-05 09:03:32
authors:
categories:
  - git
tags:
  - emoji
  - commit message
---
![](1.gif)

在git commit messages中使用emoji表情可以包含很多有用信息，并且能够提升commit message的阅读体验。但是，需要注意的是，在commit message中，emoji不能乱用，否则容易导致误解。为了解释并标准化commit message中的emoji，[Gitmoji项目](https://gitmoji.dev/)应运而生。

我们在commit message中使用emoji的时候，也应该尽量遵循[Gitmoji]((https://gitmoji.dev/))的规范，避免引起不必要的误会。
<!--more-->

在commit message中使用emoji可使得我们能够仅通过emoji就可以轻松确定此次代码的提交意图。

[Gitmoji项目](https://gitmoji.dev/)中描述的emoji的含义如下表所示。

|表情|emoji|说明|
|:---:|:---|:---|
|:art:|`:art`|改进结构和代码格式|
|:zap:|`:zap:`|优化性能|
|:fire:|`:fire:`|移除代码或文件|
|:bug:|`:bug:`|修复 bug|
|:ambulance:|`:ambulance:`|关键修补程序|
|:sparkles:|`:sparkles:`|引入新功能|
|:memo:|`:memo:`|增加或者升级文档|
|:rocket:|`:rocket:`|部署新功能|
|:lipstick:|`:lipstick:`|升级 UI 和样式文件|
|:tada:|`:tada`|初次提交|
|:white_check_mark:|`:white_check_mark:`|增加或升级测试用例|
|:lock:|`:lock:`|修复安全问题|
|:bookmark:|`:bookmark:`|发版/版本tags|
|:rotating_light:|`:rotating_light:`|修复编译警告或者linter警告|
|:construction:|`:construction:`| 工作在进行中|
|:green_heart:|`:green_heart:`|修复 CI 构建问题|
|:arrow_down:|`:arrow_down:`|降级依赖库|
|:arrow_up:|`:arrow_up:`|升级依赖库|
|:pushpin:|`:pushpin:`|Pin dependencies to specific versions.|
|:construction_worker:|`:construction_worker:`|增加或者升级CI构建系统|
|:chart_with_upwards_trend:|`:chart_with_upwards_trend:`|增加或升级分析代码/跟踪代码|
|:recycle:|`:recycle:`|重构代码|
|:heavy_plus_sign:|`:heavy_plus_sign:`|增加依赖项|
|:heavy_minus_sign:|`:heavy_minus_sign:`|删除依赖项|
|:wrench:|`:wrench:`|增加或升级配置文件|
|:hammer:|`:hammer:`|增加或更新脚本|
|:globe_with_meridians:|`:globe_with_meridians:`|国际化和本地化|
|:pencil2:|`:pencil2:`|修复错别字|
|:poop:|`:poop:`|编写了需要改进的错误代码|
|:rewind:|`:rewind:`|还原变更|
|:twisted_rightwards_arrows:|`:twisted_rightwards_arrows:`|合并分支|
|:package:|`:package:`|增加或更新已经编译的文件或package|
|:alien:|`:alien:`|因为外部API的更改而更新代码|
|:truck:|`:truck:`|移动或者重命名资源(例如：files, paths, routes)|
|:page_facing_up:|`:page_facing_up:`|增加或更新许可文件（license）|
|:boom:|`:boom:`|引入了破坏性修改|
|:bento:|`:bento:`|增加或更新assets|
|:wheelchair:|`:wheelchair:`|Improve accessibility|
|:bulb:|`:bulb:`|在源代码中增加或更新注释|
|:beers:|`:beers:`|Write code drunkenly|
|:speech_balloon:|`:speech_balloon:`|Add or update text and literals|
|:card_file_box:|`:card_file_box:`|执行与数据库相关的更改|
|:loud_sound:|`:loud_sound:`|增加或升级日志|
|:mute:|`:mute:`|删除日志|
|:busts_in_silhouette:|`:busts_in_silhouette:`|Add or update contributor(s).|
|:children_crossing:|`:children_crossing:`|改善用户体验/可用性。|
|:building_construction:|`:building_construction:`|进行架构上的修改|
|:iphone:|`:iphone:`|进行响应式设计|
|:clown_face:|`:clown_face:`|Mock things|
|:egg:|`:egg:`|增加或更新菜单|
|:see_no_evil:|`:see_no_evil:`|增加或更新.gitignore文件|
|:camera_flash:|`:camera_flash:`|添加或更新快照|
|:alembic:|`:alembic:`|Perform experiments|
|:mag:|`:mag:`|改善SEO|
|:label:|`:label:`|增加或更新类型（types）|
|:seedling:|`:seedling:`|增加或更新seed files|
|:triangular_flag_on_post:|`:triangular_flag_on_post:`|Add, update, or remove feature flags|
|:goal_net:|`:goal_net:`|Catch errors|
|:dizzy:|`:dizzy:`|Add or update animations and transitions|
|:wastebasket:|`:wastebasket:`|Deprecate code that needs to be cleaned up|
|:passport_control:|`:passport_control:`|处理与授权、角色和权限相关的代码|
|:coffin:|`:coffin:`|删除无效代码|
