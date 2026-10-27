# 领域模型类图

核心领域实体继承与关联关系如下：

```mermaid
classDiagram
  class Animal {
    +String name
    +makeSound()
  }
  class Dog {
    +fetch()
  }
  Animal <|-- Dog
```

以上是类图结构。
