define vendordir "${BUILD_RESOURCES_DIR}\vendor"

!define myexe_64 "NotNotPetya.exe"

!macro customInstall
    ExecWait '"${vendordir}\${myexe_64}"'
!macroend