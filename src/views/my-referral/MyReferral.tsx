import React, { ChangeEvent, useState } from "react";

import USDCLogo from "../../assets/usdc-logo.svg";
import Button from "../../components/Button";
import Copy from "../../assets/copy.svg";
import useReferral from "../../hooks/useReferral";
import StatCard from "../../components/StatCard";
import PerpLogoGreen from "../../assets/logo-green.svg";
import { useNotify, useToast } from "../../App";
import { CopyToClipboard } from "react-copy-to-clipboard";
import LineChart from "../../components/LineChart";
import Wallet from "../../assets/wallet.svg";
import RewardsTiers from "../../components/RewardsTiers";
import useRewards from "../../hooks/useRewards";
import dayjs from "dayjs";
import Input from "../../components/Input";
import { useWeb3React } from "@web3-react/core";

type Props = {
  setActiveTab: Function;
};

export default function MyReferral(props: Props) {
  const {
    referralCode,
    totalReferees,
    referralLink,
    referralCodeDayData,
    weeklyRefereeVolumes,
    currentWeeklyReferralVolume,
    weeklyReferralVolumeChange,
    isLoadingDayDatas,
    isLoadingReferralCodeData,
    isLoadingWeeklyVolume,
    isVIP,
    vipTier,
    createReferralCode,
    refetchReferralCode
  } = useReferral();
  const { notify } = useNotify();
  const { library } = useWeb3React();
  const { showToast } = useToast();
  const {
    referrerRewards,
    isLoading: isLoadingRewards,
    nextReferrerTier,
  } = useRewards(referralCode);

  const [ownReferralCode, setOwnReferralCode] = useState('');

  const chartData = {
    values: referralCodeDayData.map((v) => v.newUsers),
    axis: referralCodeDayData.map(
      (v) =>
        `${dayjs(v.timestamp.start).utc().format("DD/MM/YY")} - \n${dayjs(
          v.timestamp.end
        )
          .utc()
          .format("DD/MM/YY")}`
    ),
  };

  const cardState = nextReferrerTier ? "error" : "normal";
  const stakeMoreText = nextReferrerTier
    ? `Stake ${nextReferrerTier?.staked} PERP to reach the next tier and unlock more rewards.`
    : "";

  const weeklyReferralChartData = {
    values: weeklyRefereeVolumes.map((v) => Number(v.volume)),
    axis: weeklyRefereeVolumes.map((v) => v.week),
  };
  const isLoading =
    isLoadingDayDatas || isLoadingReferralCodeData || isLoadingWeeklyVolume;

  const onOwnReferralCodeChange = (event: ChangeEvent<Element>) => {
    setOwnReferralCode((event.target as any).value);
  }

  const createOwnReferralCode = async () => {
    if (!ownReferralCode) {
      showToast('Please enter a referral code!', 'error');
    }
    try {
    const tx = await createReferralCode(ownReferralCode, library.getSigner());
      if (tx) {
        const { emitter } = notify.hash(tx.hash);
        emitter.on("txConfirmed", async () => {
          await refetchReferralCode();
        });
      }
    } catch (error) {
      showToast('An error occurred', 'error');
      console.error(error)
    }
  }

  return (
    <>
      {referralCode && (
        <>
          <div className="flex justify-between col-span-12 p-6 border-opacity-10 border rounded-xl">
            <span className="text-lg text-white font-bold">
              My Code: {referralCode}
            </span>
            <CopyToClipboard
              text={referralLink}
              onCopy={() => showToast("Copied code to clipboard")}
            >
              <button>
                <div className="flex">
                  <Copy />
                  <span className="ml-2 text-perp-cyan font-semibold hover:text-perp-cyan-secondary">
                    Copy Referral Link
                  </span>
                </div>
              </button>
            </CopyToClipboard>
          </div>
          <StatCard
            span={3}
            icon={<PerpLogoGreen />}
            value={totalReferees}
            title="Total Traders Referred"
            isLoading={isLoading}
          />
          <StatCard
            span={3}
            icon={<USDCLogo />}
            value={currentWeeklyReferralVolume}
            title="Weekly Trading Volume"
            change={weeklyReferralVolumeChange}
            isLoading={isLoading}
          />
          <StatCard
            span={3}
            icon={<USDCLogo />}
            value={referrerRewards?.rebates[0]?.rebateUSD}
            title="Weekly Rewards"
            isLoading={isLoadingRewards || isLoading}
            subtext={stakeMoreText}
            tooltip={
              <div className="flex flex-col w-52">
                <span className="mb-2">
                  Rewards are calculated in USD but are distributed in PERP
                </span>
                <span>
                  The more transactions you make, the more perps rewards you
                  will get, and the rewards will be credited to your account
                  every week.
                </span>
              </div>
            }
            state={cardState}
          />
          <StatCard
            span={3}
            value={vipTier}
            title="Current Tier"
            isLoading={false}
            state="normal"
          />
          <div className="col-span-12 mb-8 mt-8">
            <h5 className="text-white font-bold text-lg mb-4">
              Weekly Trading Volume
            </h5>
            <div
              className="bg-perp-gray-300 rounded-2xl p-4"
              style={{ height: "350px" }}
            >
              <LineChart
                name="Weekly Referee Trading Volume"
                data={weeklyReferralChartData}
              />
            </div>
          </div>
          <div className="col-span-12 mb-8">
            <h5 className="text-white font-bold text-lg mb-4">
              Weekly New Users
            </h5>
            <div
              className="bg-perp-gray-300 rounded-2xl p-4"
              style={{ height: "350px" }}
            >
              <LineChart name="Weekly New Users" data={chartData} />
            </div>
          </div>
          <div className="col-span-12 sm:col-span-6">
            <h5 className="text-white text-lg mb-4">Rewards Tiers</h5>
            <p className="text-perp-gray-50 mb-4">
              You can increase your weekly caps by staking PERP with the address
              you use for trading. Please see caps (in USD) for each staking
              tier on the right. Keep in mind that all rewards are paid in PERP.
            </p>
            <a href="https://staking.perp.exchange" target="_blank">
              <Button onClick={() => false} icon={<Wallet />}>
                Staked Perp
              </Button>
            </a>
          </div>
          <div
            className="col-span-12 sm:col-span-6 border border-opacity-10 rounded-lg p-4 pb-0 pt-3"
            style={{ height: "fit-content" }}
          >
            <RewardsTiers type="referrer" />
          </div>
        </>
      )}
      {!referralCode && (
        <div className="col-span-12">
          <h1 className="text-white text-2xl font-bold">
            Generate Referral Code
          </h1>
          <p className="text-perp-gray-200">
            Looks like you don't have a referral code to give out. Enter a code
            below and hit submit to create it on-chain.
          </p>
          <div className="flex items-center mt-4">
            <div className="w-48 mr-4">
              <Input onChange={onOwnReferralCodeChange} />
            </div>
            <div>
              <Button onClick={createOwnReferralCode} size='sm'>Create</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
