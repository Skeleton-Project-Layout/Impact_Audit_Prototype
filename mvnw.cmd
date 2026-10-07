@echo off
if not defined JAVA_HOME (
    set "JAVA_HOME=C:\Users\abhin\.jdks\openjdk-26"
)
"C:\Users\abhin\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin\mvn.cmd" %*
