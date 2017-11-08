; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

;You must define Version by adding the command line argument /DVersion=x.x
;#define Version

; You must define Build by adding the command line argument  /DBuild=someint
;#define Build

; You must define the GitVersion by adding the command line argument /DGitVersion=version
;#define GitVersion

; You must define DestFile by adding the command line argument /DDestFile=destinationfile (without the .exe)
;#define DestFile

; You must define DestDir by adding the command line argument /DDestDir=dir/to/dest/file/
;#define DestDir

; You must define BuildDir by adding the command line argument /DBuildDir=dir/to/builds/
;#define BuildDir

; Specify a custom rooth path by adding the command line argument /DRootPath=path/to/root/dir
#ifndef RootPath
  #define RootPath "./"
#endif

; Specify the Architecture by adding the command line argument /DArch=
#ifndef Arch
  #define Arch "x64"
#endif
#if Arch == "x86"
;  #define GitExecutable "Git-" + GitVersion + "-32-bit.exe"
  #define BuildPath RootPath + BuildDir + "translationCore-win32-ia32\*.*"
;  #define GitInstaller "win32_git_installer.iss"
#else
;  #define GitExecutable "Git-" + GitVersion + "-64-bit.exe"
  #define BuildPath RootPath + BuildDir + "translationCore-win32-x64\*.*"
;  #define GitInstaller "win64_git_installer.iss"
#endif

#define MyAppName "translationCore"
#define MyAppPublisher "Unfolding Word"
#define MyAppURL "https://unfoldingword.org"
#define MyAppExeName "translationCore.exe"
#define MyLicenseFile RootPath + "LICENSE"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{66B9ACCC-DEB3-44FB-A4D1-C01F2AF6EF30}
AppName={#MyAppName}
AppVersion={#Version}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DisableDirPage=yes
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir={#RootPath}{#DestDir}
OutputBaseFilename={#DestFile}
SetupIconFile={#RootPath}src\images\icon.ico
Compression=lzma
SolidCompression=yes
LicenseFile={#MyLicenseFile}
#if Arch == "x86"
ArchitecturesAllowed=x86
#else
ArchitecturesAllowed=x64
#endif

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 0,6.1

[Files]
;Source: "{#RootPath}vendor\{#GitExecutable}"; DestDir: "{app}\vendor"; Flags: ignoreversion recursesubdirs deleteafterinstall
;Source: "{#RootPath}scripts\git\{#GitInstaller}"; DestDir: "{app}\vendor"; Flags: ignoreversion recursesubdirs deleteafterinstall
Source: "{#BuildPath}"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
;Filename: "{app}\vendor\{#GitExecutable}"; Parameters: "/SILENT /LOADINF=""{app}\vendor\{#GitInstaller}""";
; Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: postinstall skipifsilent
