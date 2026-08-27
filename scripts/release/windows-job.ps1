$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace QuizStage.Release
{
    public static class WindowsJob
    {
        private const uint CreateSuspended = 0x00000004;
        private const uint JobObjectLimitKillOnJobClose = 0x00002000;
        private const int JobObjectBasicAccountingInformation = 1;
        private const int JobObjectExtendedLimitInformation = 9;
        private const uint WaitObject0 = 0;
        private const uint WaitTimeout = 258;

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct StartupInfo
        {
            public int cb;
            public string lpReserved;
            public string lpDesktop;
            public string lpTitle;
            public int dwX;
            public int dwY;
            public int dwXSize;
            public int dwYSize;
            public int dwXCountChars;
            public int dwYCountChars;
            public int dwFillAttribute;
            public int dwFlags;
            public short wShowWindow;
            public short cbReserved2;
            public IntPtr lpReserved2;
            public IntPtr hStdInput;
            public IntPtr hStdOutput;
            public IntPtr hStdError;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct ProcessInformation
        {
            public IntPtr hProcess;
            public IntPtr hThread;
            public uint dwProcessId;
            public uint dwThreadId;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct BasicLimitInformation
        {
            public long PerProcessUserTimeLimit;
            public long PerJobUserTimeLimit;
            public uint LimitFlags;
            public UIntPtr MinimumWorkingSetSize;
            public UIntPtr MaximumWorkingSetSize;
            public uint ActiveProcessLimit;
            public UIntPtr Affinity;
            public uint PriorityClass;
            public uint SchedulingClass;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct IoCounters
        {
            public ulong ReadOperationCount;
            public ulong WriteOperationCount;
            public ulong OtherOperationCount;
            public ulong ReadTransferCount;
            public ulong WriteTransferCount;
            public ulong OtherTransferCount;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct ExtendedLimitInformation
        {
            public BasicLimitInformation BasicLimitInformation;
            public IoCounters IoInfo;
            public UIntPtr ProcessMemoryLimit;
            public UIntPtr JobMemoryLimit;
            public UIntPtr PeakProcessMemoryUsed;
            public UIntPtr PeakJobMemoryUsed;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct BasicAccountingInformation
        {
            public long TotalUserTime;
            public long TotalKernelTime;
            public long ThisPeriodTotalUserTime;
            public long ThisPeriodTotalKernelTime;
            public uint TotalPageFaultCount;
            public uint TotalProcesses;
            public uint ActiveProcesses;
            public uint TotalTerminatedProcesses;
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr CreateJobObject(IntPtr jobAttributes, string name);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool SetInformationJobObject(
            IntPtr job,
            int informationClass,
            IntPtr information,
            uint informationLength);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool QueryInformationJobObject(
            IntPtr job,
            int informationClass,
            IntPtr information,
            uint informationLength,
            IntPtr returnLength);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool TerminateJobObject(IntPtr job, uint exitCode);

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool CreateProcess(
            string applicationName,
            StringBuilder commandLine,
            IntPtr processAttributes,
            IntPtr threadAttributes,
            bool inheritHandles,
            uint creationFlags,
            IntPtr environment,
            string currentDirectory,
            ref StartupInfo startupInfo,
            out ProcessInformation processInformation);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern uint ResumeThread(IntPtr thread);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool GetExitCodeProcess(IntPtr process, out uint exitCode);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool TerminateProcess(IntPtr process, uint exitCode);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool CloseHandle(IntPtr handle);

        public static int Run(string executable, string workingDirectory, string[] arguments)
        {
            IntPtr job = IntPtr.Zero;
            ProcessInformation process = new ProcessInformation();
            try
            {
                job = CreateJobObject(IntPtr.Zero, null);
                if (job == IntPtr.Zero) ThrowLastError("CreateJobObject");
                SetKillOnClose(job);

                StartupInfo startup = new StartupInfo();
                startup.cb = Marshal.SizeOf(typeof(StartupInfo));
                StringBuilder commandLine = new StringBuilder(BuildCommandLine(executable, arguments));
                if (!CreateProcess(
                    executable,
                    commandLine,
                    IntPtr.Zero,
                    IntPtr.Zero,
                    false,
                    CreateSuspended,
                    IntPtr.Zero,
                    workingDirectory,
                    ref startup,
                    out process))
                {
                    ThrowLastError("CreateProcess");
                }
                if (!AssignProcessToJobObject(job, process.hProcess))
                {
                    TerminateProcess(process.hProcess, 1);
                    ThrowLastError("AssignProcessToJobObject");
                }
                if (ResumeThread(process.hThread) == uint.MaxValue) ThrowLastError("ResumeThread");
                CloseHandle(process.hThread);
                process.hThread = IntPtr.Zero;

                Task<string> command = Task.Run(() => Console.In.ReadLine());
                uint exitCode = 1;
                while (true)
                {
                    uint waitResult = WaitForSingleObject(process.hProcess, 25);
                    if (waitResult == WaitObject0)
                    {
                        if (!GetExitCodeProcess(process.hProcess, out exitCode)) ThrowLastError("GetExitCodeProcess");
                        break;
                    }
                    if (waitResult != WaitTimeout) ThrowLastError("WaitForSingleObject");
                    if (!command.IsCompleted) continue;

                    string instruction = command.GetAwaiter().GetResult();
                    if (instruction == "stop")
                    {
                        RequestGracefulStop(process.dwProcessId);
                        command = Task.Run(() => Console.In.ReadLine());
                        continue;
                    }
                    if (instruction == "force" || instruction == null) break;
                    throw new InvalidOperationException("PACKAGED_JOB_UNKNOWN_COMMAND:" + instruction);
                }

                if (ActiveProcesses(job) > 0 && !TerminateJobObject(job, 1)) ThrowLastError("TerminateJobObject");
                WaitForEmptyJob(job, 5000);
                return unchecked((int)exitCode);
            }
            finally
            {
                if (process.hThread != IntPtr.Zero) CloseHandle(process.hThread);
                if (process.hProcess != IntPtr.Zero) CloseHandle(process.hProcess);
                if (job != IntPtr.Zero) CloseHandle(job);
            }
        }

        private static void SetKillOnClose(IntPtr job)
        {
            ExtendedLimitInformation information = new ExtendedLimitInformation();
            information.BasicLimitInformation.LimitFlags = JobObjectLimitKillOnJobClose;
            int size = Marshal.SizeOf(typeof(ExtendedLimitInformation));
            IntPtr buffer = Marshal.AllocHGlobal(size);
            try
            {
                Marshal.StructureToPtr(information, buffer, false);
                if (!SetInformationJobObject(job, JobObjectExtendedLimitInformation, buffer, (uint)size))
                {
                    ThrowLastError("SetInformationJobObject");
                }
            }
            finally
            {
                Marshal.FreeHGlobal(buffer);
            }
        }

        private static uint ActiveProcesses(IntPtr job)
        {
            int size = Marshal.SizeOf(typeof(BasicAccountingInformation));
            IntPtr buffer = Marshal.AllocHGlobal(size);
            try
            {
                if (!QueryInformationJobObject(job, JobObjectBasicAccountingInformation, buffer, (uint)size, IntPtr.Zero))
                {
                    ThrowLastError("QueryInformationJobObject");
                }
                BasicAccountingInformation information =
                    (BasicAccountingInformation)Marshal.PtrToStructure(buffer, typeof(BasicAccountingInformation));
                return information.ActiveProcesses;
            }
            finally
            {
                Marshal.FreeHGlobal(buffer);
            }
        }

        private static void WaitForEmptyJob(IntPtr job, int timeoutMilliseconds)
        {
            long deadline = Environment.TickCount64 + timeoutMilliseconds;
            while (ActiveProcesses(job) > 0)
            {
                if (Environment.TickCount64 >= deadline) throw new InvalidOperationException("PACKAGED_JOB_STILL_RUNNING");
                Thread.Sleep(20);
            }
        }

        private static void RequestGracefulStop(uint processId)
        {
            using (Process taskkill = new Process())
            {
                taskkill.StartInfo.FileName = "taskkill.exe";
                taskkill.StartInfo.UseShellExecute = false;
                taskkill.StartInfo.CreateNoWindow = true;
                taskkill.StartInfo.RedirectStandardOutput = true;
                taskkill.StartInfo.RedirectStandardError = true;
                taskkill.StartInfo.ArgumentList.Add("/PID");
                taskkill.StartInfo.ArgumentList.Add(processId.ToString());
                taskkill.StartInfo.ArgumentList.Add("/T");
                taskkill.Start();
                taskkill.WaitForExit();
            }
        }

        private static string BuildCommandLine(string executable, string[] arguments)
        {
            StringBuilder commandLine = new StringBuilder(QuoteArgument(executable));
            foreach (string argument in arguments)
            {
                commandLine.Append(' ').Append(QuoteArgument(argument));
            }
            return commandLine.ToString();
        }

        private static string QuoteArgument(string argument)
        {
            if (argument.Length > 0 && argument.IndexOfAny(new[] { ' ', '\t', '\n', '\v', '"' }) < 0) return argument;
            StringBuilder quoted = new StringBuilder("\"");
            int backslashes = 0;
            foreach (char character in argument)
            {
                if (character == '\\')
                {
                    backslashes += 1;
                    continue;
                }
                if (character == '"')
                {
                    quoted.Append('\\', backslashes * 2 + 1).Append('"');
                    backslashes = 0;
                    continue;
                }
                quoted.Append('\\', backslashes).Append(character);
                backslashes = 0;
            }
            quoted.Append('\\', backslashes * 2).Append('"');
            return quoted.ToString();
        }

        private static void ThrowLastError(string operation)
        {
            throw new Win32Exception(Marshal.GetLastWin32Error(), operation);
        }
    }
}
'@

$applicationArguments = @($env:QUIZ_STAGE_JOB_ARGUMENTS | ConvertFrom-Json)
$exitCode = [QuizStage.Release.WindowsJob]::Run(
  $env:QUIZ_STAGE_JOB_EXECUTABLE,
  $env:QUIZ_STAGE_JOB_WORKING_DIRECTORY,
  [string[]]$applicationArguments)
exit $exitCode
